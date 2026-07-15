import Link from "next/link";

// Deep link into the user guide. Deliberately a plain component with no "use client" and no
// server-only imports, so both server pages and client components (DiplomaPreview) can use it.
// Size is passed per call site rather than baked in.
export function HelpLink({ anchor, className = "" }: { anchor: string; className?: string }) {
  return (
    <Link
      href={`/help#${anchor}`}
      className={`text-slate-500 hover:text-slate-700 print:hidden ${className}`}
    >
      How does this work?
    </Link>
  );
}
