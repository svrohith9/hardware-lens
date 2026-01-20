# HardwareLens

![HardwareLens demo](public/demo.gif)

Scan hardware barcodes, enrich metadata, and sync to Google Sheets in seconds.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Highlights

- PWA scanner with offline queue + background sync
- Edge API for enrichment + Google Sheets append
- 24h caching with Vercel KV
- Light/dark mode with confetti feedback

## Tech stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS + next-themes
- Workbox service worker
- Zod validation

## Quickstart

```bash
pnpm i
pnpm dev
```

## Environment

Create `.env.local` with:

```
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
NEXT_PUBLIC_APP_NAME="HardwareLens"
NEXT_PUBLIC_GS1_LOOKUP_URL="https://www.gs1.org/services/verified-by-gs1"
```

## Google service account

1. Create a service account in Google Cloud.
2. Enable the Google Sheets API for the project.
3. Download the JSON key and paste it as a single-line value in `.env.local`.
4. Share your sheet with the service account `client_email` as Editor.

Guide: https://developers.google.com/workspace/guides/create-credentials#service-account

## Data sources (free)

- OpenFoodFacts product API
- UPCItemDB trial API
- GS1 Verified and public HTML hints

## Deploy (Vercel)

```bash
pnpm build
pnpm vercel --prod
```

## Repository hygiene

- Never commit `.env.local` or service account keys.
- Keep secrets in Vercel project env vars for production.
