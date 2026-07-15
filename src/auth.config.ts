import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config (no Prisma / bcrypt). Used by middleware and merged into
// the full config in auth.ts. Route protection lives in the `authorized` callback.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true; // allow reaching the login page
      }

      if (!isLoggedIn) return false; // redirected to signIn page

      // Admin-only areas.
      const adminOnly = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/templates");
      if (adminOnly && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "STAFF";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "STAFF";
      }
      return session;
    },
  },
  providers: [], // added in auth.ts
} satisfies NextAuthConfig;
