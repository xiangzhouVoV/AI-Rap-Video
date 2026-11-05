import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Sparkles } from "lucide-react";
import { siteName, siteUrl, indexable, supportEmail } from "@/lib/site";
import PageViewTracker from "@/components/page-view-tracker";
import AccountControls from "@/components/account-controls";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "AI Rap Video Generator — Turn a photo into your moment | airaptovideo",
    template: "%s | airaptovideo",
  },
  description:
    "Create a rap video from your photo, or try the I Found You in the Crowd AI effect. Your first video is free. One-time packs, no subscription.",
  robots: { index: indexable, follow: true },
  openGraph: {
    type: "website",
    siteName,
    locale: "en_US",
    images: [
      {
        url: "/images/crowd-scene.jpg",
        width: 1536,
        height: 1024,
        alt: "Cinematic I Found You in the Crowd style preview",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0c10",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <PageViewTracker />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <nav className="nav-inner" aria-label="Main navigation">
            <Link className="wordmark" href="/" aria-label="airaptovideo home">
              <span className="brand-icon" aria-hidden="true">
                <img src="/icon.svg" width={27} height={27} alt="" />
              </span>
              airap<span>tovideo</span>
              <span className="brand-dot">.</span>
            </Link>
            <div className="nav-actions">
              <details className="effects-menu">
                <summary>
                  Effects <ChevronDown size={14} />
                </summary>
                <div className="effects-dropdown">
                  <Link href="/i-found-you-in-the-crowd">
                    <span>I Found You in the Crowd</span>
                    <span className="tiny-label">TRENDING</span>
                  </Link>
                  <Link href="/dance-rap-video">
                    Dance rap video <ArrowUpRight size={14} />
                  </Link>
                  <Link href="/rap-video">
                    Rap video <ArrowUpRight size={14} />
                  </Link>
                  <Link href="/effects/">
                    Explore all effects <ArrowUpRight size={14} />
                  </Link>
                </div>
              </details>
              <AccountControls />
            </div>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="footer-top">
            <Link className="wordmark" href="/">
              airap<span>tovideo</span>
              <span className="brand-dot">.</span>
            </Link>
            <p>A photo. A little imagination. Your next moment.</p>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} airaptovideo</p>
            <div>
              <Link href="/">AI rap video generator</Link>
              <Link href="/effects/">Effects</Link>
              <Link href="/rap-name-generator">Rap name generator</Link>
            </div>
            <span>
              Made for your main character era <Sparkles size={12} />
            </span>
          </div>
          <div className="footer-legal">
            <nav aria-label="Legal">
              <strong>Legal</strong>
              <Link href="/privacy">Privacy</Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms">Terms</Link>
              <span aria-hidden="true">·</span>
              <Link href="/refunds">Refunds</Link>
              <span aria-hidden="true">·</span>
              <Link href="/cookies">Cookies</Link>
            </nav>
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
