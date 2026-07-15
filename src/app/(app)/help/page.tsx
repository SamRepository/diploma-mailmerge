import { cookies } from "next/headers";
import { requireUser } from "@/lib/session";
import { HelpGuide } from "./HelpGuide";

export const metadata = { title: "Help — Diploma Mail-Merge" };

export default async function HelpPage() {
  // requireUser, not requireAdmin: admin-only topics are shown to everyone with a badge, so
  // staff can see the whole workflow. /help matches neither the /admin nor /templates prefix
  // in auth.config.ts, so the route gate already allows any signed-in user.
  await requireUser();

  // Read the language on the server so the first paint is already correct. localStorage would
  // force the server to guess "en" and flash the whole page from English to RTL Arabic after
  // hydration.
  const store = await cookies();
  const lang = store.get("help-lang")?.value === "ar" ? "ar" : "en";

  return <HelpGuide initialLang={lang} />;
}
