# HardwareLens

Scan hardware barcodes, enrich metadata, and sync to Google Sheets.

![HardwareLens demo](public/demo.gif)

## Quickstart

```bash
pnpm i
pnpm dev
```

## Env

`.env.local`:

```
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
NEXT_PUBLIC_APP_NAME="HardwareLens"
NEXT_PUBLIC_GS1_LOOKUP_URL="https://www.gs1.org/services/verified-by-gs1"
```

## Data sources (free)

- OpenFoodFacts
- UPCItemDB (trial)
- GS1 public HTML hints

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

```bash
pnpm build
pnpm vercel --prod
```

## Replit

- Import the repo and add secrets: `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_GS1_LOOKUP_URL`.

## Notes

- Keep `.env.local` and service account keys private.
- Guide: https://developers.google.com/workspace/guides/create-credentials#service-account
