import type { Metadata } from "next";
import Link from "next/link";

// Next.js adds noindex to 404 responses; clear the directive inherited from the layout.
export const metadata: Metadata = { robots: null };

export default function NotFound() {
  return (
    <section className="page-container empty-page">
      <p className="eyebrow">404 / WRONG SCENE</p>
      <h1>Let’s find your next moment.</h1>
      <p className="muted">
        This effect doesn’t have a page yet. Explore the effects you can try
        today.
      </p>
      <Link className="button-primary" href="/effects/">
        Explore effects →
      </Link>
      <Link className="text-link" href="/">
        AI rap video generator
      </Link>
    </section>
  );
}
