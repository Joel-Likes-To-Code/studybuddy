import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import SettingsButton from "../components/ui/SettingsButton";

// ⬇️ Auth.js v5 helpers
import { auth, signIn, signOut } from "../../auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyBuddy",
  description: "Jot notes. Generate flashcards. Review daily.",
};

// Server actions for header buttons
async function signInGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/dashboard" });
}

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

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

              {session ? (
                <form action={signOutAction}>
                  <button className="text-sm rounded-md border px-3 py-1.5">
                    Sign out
                  </button>
                </form>
              ) : (
                <form action={signInGoogle}>
                  <button className="text-sm rounded-md border px-3 py-1.5">
                    Sign in
                  </button>
                </form>
              )}

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
