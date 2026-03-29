/**
 * Validated environment variables for DocuConversion.
 * Uses Zod to ensure all required env vars are present and correctly typed
 * at build time, preventing runtime errors from misconfiguration.
 *
 * @remarks zod is listed in package.json dependencies.
 */

import { z } from "zod";

/** Schema for public (client-safe) environment variables */
const PUBLIC_ENV_SCHEMA = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url("NEXT_PUBLIC_API_URL must be a valid URL")
    .default("http://localhost:8000"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
});

/** Schema for server-only environment variables */
const SERVER_ENV_SCHEMA = z.object({
  BACKEND_URL: z
    .string()
    .url("BACKEND_URL must be a valid URL")
    .default("http://localhost:8000"),
});

/** Combined schema for all environment variables */
const ENV_SCHEMA = PUBLIC_ENV_SCHEMA.merge(SERVER_ENV_SCHEMA);

/** Validated and typed environment variables */
export type Env = z.infer<typeof ENV_SCHEMA>;

/**
 * Parses and validates environment variables.
 * Falls back to defaults for local development when vars are unset.
 */
function validateEnv(): Env {
  const result = ENV_SCHEMA.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BACKEND_URL: process.env.BACKEND_URL,
  });

  if (!result.success) {
    console.error(
      "Environment validation failed:",
      result.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables. Check server logs.");
  }

  return result.data;
}

/** Validated environment variables — import this instead of reading process.env directly */
export const env = validateEnv();
