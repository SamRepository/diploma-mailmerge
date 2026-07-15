// Server-only secret the headless-Chromium PDF renderer uses to authenticate to the
// internal /print pages (over 127.0.0.1, where the session cookie's domain wouldn't
// match). Falls back to AUTH_SECRET so no extra env is required.
export function renderToken(): string {
  return process.env.RENDER_TOKEN || process.env.AUTH_SECRET || "";
}

export function isValidRenderToken(token: string | undefined | null): boolean {
  const expected = renderToken();
  return !!expected && !!token && token === expected;
}
