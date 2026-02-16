import { z } from "zod";

const envSchema = z.object({
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().min(1, "GOOGLE_SERVICE_ACCOUNT_JSON is required"),
  GOOGLE_SHEET_ID: z.string().min(1, "GOOGLE_SHEET_ID is required")
});

export function getRequiredEnv() {
  const parsed = envSchema.safeParse({
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed.data;
}
