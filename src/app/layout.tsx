import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diploma Mail-Merge",
  description: "Print bilingual PhD diplomas onto pre-printed ministry paper.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
