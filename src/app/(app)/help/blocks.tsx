import Link from "next/link";
import type { Block, Inline } from "@/lib/helpContent";

// A UI label quoted from the app, e.g. "+ Add student".
//
// Two things here are load-bearing in Arabic, and both are invisible in English:
//   <bdi dir="ltr"> — without it the bidi algorithm reorders the label inside an RTL paragraph
//   and the leading "+" or "—" jumps to the wrong end.
//   font-sans — `font-arabic` inherits from the page wrapper, so an English label would
//   otherwise render in Amiri serif.
function Chip({ text }: { text: string }) {
  return (
    <bdi
      dir="ltr"
      className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-sans text-[13px] font-medium text-slate-700"
    >
      {text}
    </bdi>
  );
}

function Kbd({ text }: { text: string }) {
  return (
    <bdi
      dir="ltr"
      className="rounded border border-slate-300 border-b-2 bg-white px-1.5 py-0.5 font-sans text-[12px] font-semibold text-slate-600"
    >
      {text}
    </bdi>
  );
}

function InlineNode({ node }: { node: Inline }) {
  if (typeof node === "string") return <>{node}</>;
  if ("chip" in node) return <Chip text={node.chip} />;
  if ("kbd" in node) return <Kbd text={node.kbd} />;
  return (
    <Link href={node.link.href} className="text-indigo-600 underline hover:text-indigo-700">
      {node.link.label}
    </Link>
  );
}

function Inlines({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => (
        <InlineNode key={i} node={n} />
      ))}
    </>
  );
}

/** Amber callout, matching the existing inline notices elsewhere in the app. */
function Callout({ nodes, tone }: { nodes: Inline[]; tone: "note" | "warning" }) {
  const cls =
    tone === "warning"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <p className={`rounded border px-3 py-2 text-sm ${cls}`}>
      <Inlines nodes={nodes} />
    </p>
  );
}

export function BlockNode({ block }: { block: Block }) {
  switch (block.kind) {
    case "para":
      return (
        <p className="text-sm leading-relaxed text-slate-600">
          <Inlines nodes={block.text} />
        </p>
      );
    case "steps":
      return (
        <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400">
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines nodes={item} />
            </li>
          ))}
        </ol>
      );
    case "bullets":
      return (
        <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400">
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines nodes={item} />
            </li>
          ))}
        </ul>
      );
    case "note":
      return <Callout nodes={block.text} tone="note" />;
    case "warning":
      return <Callout nodes={block.text} tone="warning" />;
    default: {
      // Exhaustiveness guard: adding a 6th Block kind fails typecheck here rather than
      // silently rendering nothing. `never` is assignable to ReactNode, so returning it
      // both satisfies the signature and keeps the binding used.
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}
