"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, ArrowUpRight } from "lucide-react";
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Heart size={21} fill="currentColor" />
          </span>
          flirtpilot<span className="beta">BETA</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link
            href="/check"
            className="mobile-check"
            aria-current={pathname === "/check" ? "page" : undefined}
          >
            Check my reply
          </Link>
          <Link href="/#how-it-works" className="desktop-link">
            How it works
          </Link>
          <Link
            href="/reply"
            className={`header-cta${pathname === "/reply" ? " header-cta-entered" : ""}`}
            aria-hidden={pathname === "/reply" ? true : undefined}
            tabIndex={pathname === "/reply" ? -1 : undefined}
          >
            Let’s talk <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      {children}
      <footer>
        <Link href="/" className="brand">
          flirtpilot<span className="pink">✳</span>
        </Link>
        <span>A little context. A lot less overthinking.</span>
        <Link href="/lab">Learning Lab</Link>
        <span>Made for adults. Built for real conversations.</span>
      </footer>
    </div>
  );
}
