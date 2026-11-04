import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlirtPilot — Never wonder what to text again",
  description: "Your context-aware AI texting wingman for adults.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <div className="creator-watermark">Saksham Rupakheti World</div>
      </body>
    </html>
  );
}
