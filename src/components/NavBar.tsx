import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "./SignOutButton";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/import", label: "Import" },
  { href: "/print/batch", label: "Bulk print" },
  { href: "/help", label: "Help" },
];

const adminLinks = [
  { href: "/templates", label: "Templates" },
  { href: "/admin/users", label: "Users" },
];

export async function NavBar() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-4 font-semibold text-slate-900">
          🎓 Diploma Merge
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {l.label}
          </Link>
        ))}
        {isAdmin &&
          adminLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50"
            >
              {l.label}
            </Link>
          ))}
        <div className="ml-auto flex items-center gap-3 text-sm text-slate-500">
          <span>
            {session?.user?.name}
            {isAdmin ? " · admin" : ""}
          </span>
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
}
