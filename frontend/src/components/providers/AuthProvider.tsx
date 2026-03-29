/**
 * Session provider wrapper for NextAuth.js.
 * Must wrap the app to enable useSession() in client components.
 */

"use client";

import { SessionProvider } from "next-auth/react";

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
