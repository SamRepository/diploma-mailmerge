"use client";

import { useEffect, useState } from "react";
import { HELP_SECTIONS, type Lang } from "@/lib/helpContent";
import { BlockNode } from "./blocks";

const UI = {
  en: {
    title: "Help & user guide",
    subtitle: "How to enter students, align the printer, and print onto the pre-printed diplomas.",
    onThisPage: "On this page",
    adminOnly: "Admin only",
  },
  ar: {
    title: "المساعدة ودليل الاستعمال",
    subtitle: "كيفية إدخال الطلبة، ومحاذاة الطابعة، والطباعة على الشهادات المطبوعة مسبقًا.",
    onThisPage: "في هذه الصفحة",
    adminOnly: "للمشرفين فقط",
  },
} as const;

function AdminBadge({ lang }: { lang: Lang }) {
  // Indigo deliberately: the nav bar already uses indigo for admin-only links, so this reads
  // without needing a legend. font-sans so the English variant does not inherit Amiri.
  return (
    <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-indigo-700">
      {UI[lang].adminOnly}
    </span>
  );
}

export function HelpGuide({ initialLang }: { initialLang: Lang }) {
  // Seeded from the server-read cookie, so the first client render matches the server render
  // exactly — a hydration mismatch is structurally impossible rather than merely unlikely.
  const [lang, setLang] = useState<Lang>(initialLang);
  const [active, setActive] = useState<string>(HELP_SECTIONS[0].id);

  function pick(next: Lang) {
    setLang(next); // instant; no server round trip
    // Not httpOnly on purpose: the client owns this preference, and the server only reads it
    // to get the first paint right.
    document.cookie = `help-lang=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "0px 0px -66% 0px" },
    );
    // Anchors live on the section, not inside en/ar, so this survives a language change and
    // never needs re-observing.
    for (const s of HELP_SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const rtl = lang === "ar";

  return (
    <div dir={rtl ? "rtl" : "ltr"} className={rtl ? "font-arabic" : undefined}>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{UI[lang].title}</h1>
          <p className="mt-1 text-sm text-slate-500">{UI[lang].subtitle}</p>
        </div>
        {/* dir="ltr" so "EN | العربية" keeps a stable order when the page flips. */}
        <div dir="ltr" className="flex shrink-0 items-center gap-1 rounded border border-slate-300 bg-white p-0.5">
          <LangButton current={lang} value="en" label="EN" onPick={pick} />
          <LangButton current={lang} value="ar" label="العربية" onPick={pick} />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* self-start is load-bearing: a grid item stretches to row height by default, which
            leaves `sticky` no room to travel and the ToC would never stick. */}
        <nav className="sticky top-6 hidden self-start lg:block">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {UI[lang].onThisPage}
          </div>
          <ul className="space-y-1 border-s border-slate-200">
            {HELP_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`-ms-px flex items-center gap-1.5 border-s-2 py-1 ps-3 text-sm ${
                    active === s.id
                      ? "border-indigo-500 font-medium text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>{s[lang].title}</span>
                  {s.adminOnly && <AdminBadge lang={lang} />}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 space-y-10">
          {HELP_SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-4">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span>{s[lang].title}</span>
                {s.adminOnly && <AdminBadge lang={lang} />}
              </h2>
              <div className="space-y-3">
                {s[lang].blocks.map((b, i) => (
                  <BlockNode key={i} block={b} />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

function LangButton({
  current,
  value,
  label,
  onPick,
}: {
  current: Lang;
  value: Lang;
  label: string;
  onPick: (l: Lang) => void;
}) {
  const on = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      aria-pressed={on}
      className={`rounded px-2.5 py-1 text-sm ${
        on ? "bg-indigo-600 font-medium text-white" : "text-slate-600 hover:bg-slate-100"
      } ${value === "ar" ? "font-arabic" : "font-sans"}`}
    >
      {label}
    </button>
  );
}
