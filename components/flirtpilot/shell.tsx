import Link from "next/link";
import { Heart, ArrowUpRight } from "lucide-react";
export function AppShell({ children }: { children: React.ReactNode }) {
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
          <Link href="/#modes">The wingman</Link>
          <Link href="/#how-it-works" className="desktop-link">
            How it works
          </Link>
          <Link href="/reply" className="header-cta">
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
        <span>Made for adults. Built for real conversations.</span>
      </footer>
    </div>
  );
}
