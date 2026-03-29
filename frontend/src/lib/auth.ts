/**
 * NextAuth.js v5 configuration for DocuConversion.
 * Handles OAuth authentication (Google, GitHub) with JWT sessions.
 * The JWT is signed with HS256 so the Python backend can validate it.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, add custom claims
      if (user) {
        token.userId = user.id;
        token.tier = "free"; // Default tier for new users
      }
      return token;
    },
    async session({ session, token }) {
      // Make custom claims available to the client via session
      if (session.user) {
        session.user.id = token.userId as string;
        (session as any).tier = (token.tier as string) || "free";
      }
      return session;
    },
  },
});
