import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
