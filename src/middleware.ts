import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Middleware uses the edge-safe config only.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect everything except Next internals, the auth API, health check, and static assets.
  // `print` is excluded — those pages guard themselves (session OR internal render token)
  // so the headless PDF renderer can reach them over 127.0.0.1 without a session cookie.
  matcher: ["/((?!api/auth|api/health|print|_next/static|_next/image|favicon.ico|fonts|uploads).*)"],
};
