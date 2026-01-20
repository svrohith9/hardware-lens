import { z } from "zod";

export const barcodeSchema = z.string().regex(/^[0-9]{8,14}$/);

export const enrichResponseSchema = z.object({
  Timestamp: z.string(),
  Barcode: z.string(),
  Brand: z.string().nullable(),
  Model: z.string().nullable(),
  CPU: z.string().nullable(),
  RAM: z.string().nullable(),
  SSD: z.string().nullable(),
  Warranty: z.string().nullable(),
  ResaleUSD: z.string().nullable(),
  CO2kg: z.string().nullable(),
  iFixit: z.string().nullable(),
  ImageURL: z.string().nullable(),
  Notes: z.string().nullable()
});

export type EnrichResponse = z.infer<typeof enrichResponseSchema>;
