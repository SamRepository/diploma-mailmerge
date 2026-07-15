import "server-only";
import { chromium, type Browser } from "playwright";
import { PDFDocument } from "pdf-lib";
import { renderToken } from "@/lib/renderToken";

// Base URL Chromium uses to reach the app. In production set PDF_RENDER_BASE_URL to the
// container-internal address (e.g. http://127.0.0.1:3000) to avoid an external round-trip;
// the /print pages authenticate via the render token, not the session cookie.
function renderBase(origin: string): string {
  return process.env.PDF_RENDER_BASE_URL || origin;
}

// Parse a raw Cookie header into Playwright cookie objects scoped to the given origin.
function cookiesForOrigin(cookieHeader: string, origin: string) {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const eq = c.indexOf("=");
      const name = c.slice(0, eq);
      const value = c.slice(eq + 1);
      return { name, value, url: origin };
    })
    .filter((c) => c.name);
}

const A4_LANDSCAPE = { width: "297mm", height: "210mm" };

async function renderOne(browser: Browser, origin: string, cookieHeader: string, url: string): Promise<Uint8Array> {
  const context = await browser.newContext();
  await context.addCookies(cookiesForOrigin(cookieHeader, origin));
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    // Ensure webfonts (Amiri) are ready so Arabic is shaped before capture.
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);
    const pdf = await page.pdf({
      width: A4_LANDSCAPE.width,
      height: A4_LANDSCAPE.height,
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      pageRanges: "1",
    });
    return pdf;
  } finally {
    await context.close();
  }
}

function printUrl(origin: string, studentId: string, opts: { bg: boolean; offX?: number; offY?: number }): string {
  const p = new URLSearchParams();
  p.set("bg", opts.bg ? "1" : "0");
  if (opts.offX) p.set("offX", String(opts.offX));
  if (opts.offY) p.set("offY", String(opts.offY));
  const token = renderToken();
  if (token) p.set("token", token);
  return `${renderBase(origin)}/print/diploma/${studentId}?${p.toString()}`;
}

export async function renderDiplomaPdf(
  origin: string,
  cookieHeader: string,
  studentId: string,
  opts: { bg: boolean; offX?: number; offY?: number },
): Promise<Uint8Array> {
  const browser = await chromium.launch();
  try {
    return await renderOne(browser, origin, cookieHeader, printUrl(origin, studentId, opts));
  } finally {
    await browser.close();
  }
}

export async function renderManyDiplomasPdf(
  origin: string,
  cookieHeader: string,
  studentIds: string[],
  opts: { bg: boolean; offX?: number; offY?: number },
): Promise<Uint8Array> {
  const browser = await chromium.launch();
  const merged = await PDFDocument.create();
  try {
    for (const id of studentIds) {
      const bytes = await renderOne(browser, origin, cookieHeader, printUrl(origin, id, opts));
      const doc = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    return await merged.save();
  } finally {
    await browser.close();
  }
}
