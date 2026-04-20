# HardwareLens

Scan hardware barcodes, enrich metadata from public sources, and sync results into Google Sheets.

![HardwareLens demo](public/demo.gif)

## Overview

HardwareLens is a Next.js app designed for quick inventory capture:

- Scan barcodes from device camera
- Enrich product metadata from public datasets (OpenFoodFacts, UPCItemDB trial, web hints)
- Persist scan history and lightweight metrics in KV
- Append normalized rows to a Google Sheet

## Architecture / Stack

- **Framework:** Next.js 14 (App Router, Edge runtime for enrichment API)
- **Language:** TypeScript
- **UI:** TailwindCSS
- **Storage:** Vercel KV (with in-memory fallback for local/dev)
- **Integrations:** Google Sheets API (service account JWT)

```mermaid
flowchart LR
  A[Barcode Scan] --> B[/api/enrich]
  B --> C[Public Data Sources]
  B --> D[KV cache + rate limit]
  B --> E[Google Sheets append]
  E --> F[Inventory Spreadsheet]
```

## Quickstart

### Prerequisites

- Node.js 18+
- pnpm (`pnpm@9` recommended)

### Install

```bash
pnpm install
```

## Environment Variables

Copy `.env.example` into `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_GS1_LOOKUP_URL`

Optional (production):

- `KV_REST_API_URL` and related Vercel KV credentials

## Run

```bash
pnpm dev
```

Local URL: `http://localhost:3000`

## Test

No dedicated automated test suite is configured yet.

Use:

```bash
pnpm lint
pnpm build
```

## Deployment

### Vercel

```bash
pnpm build
pnpm vercel --prod
```

Make sure all required environment variables are set in the deployment environment.

## API Snippet

`POST /api/enrich`

Request:

```json
{
  "barcode": "012345678905"
}
```

Response shape (simplified):

```json
{
  "data": {
    "Brand": "...",
    "Model": "...",
    "CPU": null,
    "RAM": null,
    "SSD": null,
    "Warranty": null,
    "ResaleUSD": null,
    "CO2kg": null,
    "iFixit": null,
    "ImageURL": "...",
    "Notes": "Auto-enriched"
  },
  "meta": {
    "cacheHit": false,
    "sources": {
      "openFoodFacts": true,
      "upcItemDb": false,
      "htmlHints": true
    }
  }
}
```

## Troubleshooting

- **`GOOGLE_SERVICE_ACCOUNT_JSON is not set`**
  - Add valid service account JSON string to `.env.local`.
- **Sheets API errors (401/403)**
  - Validate service account permissions and target sheet sharing.
- **Rate limit responses**
  - Enrichment endpoint enforces request limits per IP/time window.
- **KV not configured locally**
  - Local fallback in-memory store is used automatically.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](LICENSE).
