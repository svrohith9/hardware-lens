import { SignJWT, importPKCS8 } from "jose";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const tokenCache = new Map<string, { token: string; exp: number }>();

export function getServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  }
  const parsed = JSON.parse(raw) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Invalid service account JSON");
  }
  return parsed;
}

export async function getAccessToken(scope: string) {
  const cached = tokenCache.get(scope);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - 60 > now) {
    return cached.token;
  }

  const sa = getServiceAccount();
  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const privateKey = await importPKCS8(sa.private_key, "RS256");

  const jwt = await new SignJWT({ scope })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now)
    .setIssuer(sa.client_email)
    .setAudience(tokenUri)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache.set(scope, { token: payload.access_token, exp: now + payload.expires_in });
  return payload.access_token;
}
