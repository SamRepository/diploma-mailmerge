"use client";

export function PrintButton({ label = "Print", className }: { label?: string; className?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={className ?? "rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"}
    >
      {label}
    </button>
  );
}
