/**
 * NextAuth.js API route handler.
 * Handles all /api/auth/* requests (signin, signout, callback, session).
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
