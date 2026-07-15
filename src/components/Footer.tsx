export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-4 text-center text-xs text-slate-500">
        <span>© 2026 — Skikda</span>
        <span aria-hidden className="text-slate-300">|</span>
        <span>Developed by Dr. Samir SELLAMI and maintained by ENSET-Skikda</span>
        <span aria-hidden className="text-slate-300">|</span>
        <span>
          Contact :{" "}
          <a href="mailto:s.sellami@enset-skikda.dz" className="text-slate-600 underline hover:text-slate-900">
            s.sellami@enset-skikda.dz
          </a>
        </span>
      </div>
    </footer>
  );
}
