import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { barcodeSchema } from "@/lib/schemas";
import { getAccessToken } from "@/lib/google";

export const runtime = "edge";

const headersRow = [
  "Timestamp",
  "Barcode",
  "Brand",
  "Model",
  "CPU",
  "RAM",
  "SSD",
  "Warranty",
  "ResaleUSD",
  "CO2kg",
  "iFixit",
  "ImageURL",
  "Notes"
];

const SHEET_NAME = "Sheet1";

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? (request.url.startsWith("https") ? "https" : "http");
  const allowedOrigin = host ? `${proto}://${host}` : new URL(request.url).origin;
  if (origin && origin !== allowedOrigin) {
    return null;
  }
  return {
    "access-control-allow-origin": origin ?? allowedOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  };
}

function getIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

async function rateLimit(request: Request) {
  const ip = getIp(request);
  const key = `rate:${ip}:${new Date().toISOString().slice(0, 16)}`;
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, 60);
  }
  return count > 30;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; HardwareLens/1.0)"
    }
  });
  if (!response.ok) return null;
  return response.text();
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; HardwareLens/1.0)"
    }
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

function extractData(htmls: Array<string | null>) {
  const combined = htmls.filter(Boolean).join("\n");
  const titleMatch = combined.match(/<title>([^<]+)<\/title>/i);
  const ogImageMatch = combined.match(/property="og:image" content="([^"]+)"/i);
  const brandMatch = combined.match(/Brand[^A-Za-z0-9]{0,10}([A-Za-z0-9\- ]{2,30})/i);
  const cpuMatch = combined.match(/(Intel|AMD|Apple)[^<\n]{0,40}/i);
  const ramMatch = combined.match(/(\d+\s?GB)\s?(RAM|Memory)/i);
  const ssdMatch = combined.match(/(\d+\s?GB|\d+\s?TB)\s?(SSD|Storage)/i);
  const warrantyMatch = combined.match(/(\d+\s?(year|yr|month|mo)s?\s?warranty)/i);

  return {
    Brand: brandMatch?.[1]?.trim() ?? null,
    Model: titleMatch?.[1]?.split("|")[0]?.trim() ?? null,
    CPU: cpuMatch?.[0]?.trim() ?? null,
    RAM: ramMatch?.[1]?.trim() ?? null,
    SSD: ssdMatch?.[1]?.trim() ?? null,
    Warranty: warrantyMatch?.[1]?.trim() ?? null,
    ImageURL: ogImageMatch?.[1]?.trim() ?? null
  };
}

type OpenFoodFactsResponse = {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_url?: string;
  };
};

type UpcItemDbResponse = {
  items?: Array<{
    title?: string;
    brand?: string;
    images?: string[];
    description?: string;
  }>;
};

function mergePreferred(
  primary: Record<string, string | null>,
  secondary: Record<string, string | null>
) {
  const merged = { ...secondary };
  for (const [key, value] of Object.entries(primary)) {
    if (value) merged[key] = value;
  }
  return merged;
}

async function enrichBarcode(barcode: string) {
  const cacheKey = `scrape:${barcode}`;
  const cached = await kv.get(cacheKey);
  if (cached) return cached as Record<string, string | null>;

  const off = await fetchJson<OpenFoodFactsResponse>(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
  );
  const offData =
    off?.status === 1
      ? {
          Brand: off.product?.brands?.split(",")[0]?.trim() ?? null,
          Model: off.product?.product_name ?? null,
          ImageURL: off.product?.image_url ?? null
        }
      : null;

  const upc = await fetchJson<UpcItemDbResponse>(
    `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`
  );
  const upcItem = upc?.items?.[0];
  const upcData = upcItem
    ? {
        Brand: upcItem.brand ?? null,
        Model: upcItem.title ?? null,
        ImageURL: upcItem.images?.[0] ?? null,
        Notes: upcItem.description ?? null
      }
    : null;

  const gs1Url = `https://www.gs1.org/services/verified-by-gs1/results?gtin=${barcode}`;
  const googleShop = `https://www.google.com/search?tbm=shop&q=${barcode}`;
  const manufacturerSearch = `https://www.google.com/search?q=${barcode}+manufacturer`;

  const [gs1Html, shopHtml, manufacturerHtml] = await Promise.all([
    fetchHtml(gs1Url),
    fetchHtml(googleShop),
    fetchHtml(manufacturerSearch)
  ]);

  const extracted = extractData([gs1Html, shopHtml, manufacturerHtml]);
  const merged = mergePreferred(
    upcData ? mergePreferred(upcData, extracted) : extracted,
    offData ?? {}
  );

  const result = {
    ...merged,
    ResaleUSD: null,
    CO2kg: null,
    iFixit: null,
    Notes: merged.Notes ?? "Auto-enriched"
  };

  await kv.set(cacheKey, result, { ex: 60 * 60 * 24 });
  return result;
}

async function ensureHeader(accessToken: string, sheetId: string) {
  const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    `${SHEET_NAME}!A1:M1`
  )}`;
  const headerResponse = await fetch(headerUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!headerResponse.ok) {
    const body = await headerResponse.text();
    throw new Error(`Sheets header fetch failed: ${headerResponse.status} ${body}`);
  }
  const headerData = (await headerResponse.json()) as { values?: string[][] };
  const existing = headerData.values?.[0] ?? [];
  if (existing.join("|") === headersRow.join("|")) {
    return;
  }

  const writeResponse = await fetch(`${headerUrl}?valueInputOption=RAW`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ range: `${SHEET_NAME}!A1:M1`, values: [headersRow] })
  });
  if (!writeResponse.ok) {
    const body = await writeResponse.text();
    throw new Error(`Sheets header write failed: ${writeResponse.status} ${body}`);
  }
}

async function appendRow(accessToken: string, sheetId: string, row: Record<string, string | null>) {
  const values = headersRow.map((key) => row[key] ?? "");
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    `${SHEET_NAME}!A1:M1`
  )}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const appendResponse = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ values: [values] })
  });
  if (!appendResponse.ok) {
    const body = await appendResponse.text();
    throw new Error(`Sheets append failed: ${appendResponse.status} ${body}`);
  }
}

export async function OPTIONS(request: Request) {
  const cors = corsHeaders(request);
  if (!cors) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(request: Request) {
  const cors = corsHeaders(request);
  if (!cors) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (await rateLimit(request)) {
    return new NextResponse("Rate limit exceeded", { status: 429, headers: cors });
  }

  const url = new URL(request.url);
  if (!url.searchParams.get("last")) {
    return NextResponse.json({ ok: true }, { headers: cors });
  }

  const cacheKey = "last-scans";
  const cached = await kv.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: cors });
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return new NextResponse("Missing GOOGLE_SHEET_ID", { status: 500, headers: cors });
  }

  const accessToken = await getAccessToken("https://www.googleapis.com/auth/spreadsheets");
  const range = `${SHEET_NAME}!A2:M`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = (await response.json()) as { values?: string[][] };
  const rows = data.values ?? [];
  const tail = rows.slice(-10);
  const shaped = tail
    .map((row) =>
      headersRow.reduce<Record<string, string | null>>((acc, key, index) => {
        acc[key] = row[index] ?? null;
        return acc;
      }, {})
    )
    .reverse();

  await kv.set(cacheKey, shaped, { ex: 60 });
  return NextResponse.json(shaped, { headers: cors });
}

export async function POST(request: Request) {
  const cors = corsHeaders(request);
  if (!cors) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (await rateLimit(request)) {
    return new NextResponse("Rate limit exceeded", { status: 429, headers: cors });
  }

  const body = await request.json();
  const parsed = barcodeSchema.safeParse(body?.barcode);
  if (!parsed.success) {
    return new NextResponse("Invalid barcode", { status: 400, headers: cors });
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return new NextResponse("Missing GOOGLE_SHEET_ID", { status: 500, headers: cors });
  }

  try {
    const accessToken = await getAccessToken("https://www.googleapis.com/auth/spreadsheets");
    await ensureHeader(accessToken, sheetId);

    const enriched = await enrichBarcode(parsed.data);
    const row = {
      Timestamp: new Date().toISOString(),
      Barcode: parsed.data,
      Brand: enriched.Brand,
      Model: enriched.Model,
      CPU: enriched.CPU,
      RAM: enriched.RAM,
      SSD: enriched.SSD,
      Warranty: enriched.Warranty,
      ResaleUSD: enriched.ResaleUSD,
      CO2kg: enriched.CO2kg,
      iFixit: enriched.iFixit,
      ImageURL: enriched.ImageURL,
      Notes: enriched.Notes
    };

    await appendRow(accessToken, sheetId, row);
    await kv.del("last-scans");

    return NextResponse.json(row, { headers: cors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500, headers: cors });
  }
}
