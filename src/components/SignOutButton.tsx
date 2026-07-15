"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  // Resolve the post-signout URL in the browser rather than passing a relative
  // callbackUrl for the server to expand: behind a reverse proxy the server can
  // infer the wrong origin and send users to localhost. Mirrors the sign-in flow.
  async function onSignOut() {
    await signOut({ redirect: false });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={onSignOut}
      className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
    >
      Sign out
    </button>
  );
}
