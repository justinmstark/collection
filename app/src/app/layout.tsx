"use client";

import "./globals.css";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="border-b border-gold/20 bg-navy-light px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-gold font-serif text-2xl tracking-wide hover:text-gold-light transition-colors">
          The Collection
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-300 hover:text-gold transition-colors">
            Collection
          </Link>
          <Link href="/collection/add" className="text-sm text-gray-300 hover:text-gold transition-colors">
            Add Bottle
          </Link>
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{session.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-gray-400 hover:text-gold transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm text-gold hover:text-gold-light transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>The Collection</title>
        <meta name="description" content="Personal whisky, wine & spirits collection" />
      </head>
      <body className="min-h-screen bg-navy text-gray-100">
        <SessionProvider>
          <Nav />
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
