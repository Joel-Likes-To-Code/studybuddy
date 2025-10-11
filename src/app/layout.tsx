import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/src/app/globals.css";
import Link from "next/link";
import SettingsButton from "../components/ui/SettingsButton";
import SignInButtons from "../components/ui/SignInButtons";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyBuddy",
  description: "Jot notes. Generate flashcards. Review daily.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" data-theme="light" data-palette="calm-spark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col`}>
        {/* Header */}
        <header className="border-b border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]">
          <nav className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl">StudyBuddy</Link>

            <div className="flex items-center gap-4">
              {/* Always show Dashboard link; the page itself can guard/redirect */}
              <Link href="/dashboard" className="text-sm hover:underline">Dashboard</Link>

              <SignInButtons />
              <SettingsButton />
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[var(--border)] bg-[var(--muted)]">
          <div className="max-w-5xl mx-auto px-6 py-4 text-sm text-[var(--muted-foreground)] flex justify-between">
          </div>
        </footer>
      </body>
    </html>
  );
}
