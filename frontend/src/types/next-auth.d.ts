/**
 * Type augmentation for NextAuth.js v5.
 * Extends the default Session and JWT types with DocuConversion-specific fields.
 */

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tier: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    tier: string;
  }
}
