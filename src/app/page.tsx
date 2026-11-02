import type { Metadata } from "next";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import Generator from "@/components/generator";
import {
  FaqSection,
  HowItWorks,
  RelatedLinks,
} from "@/components/content-sections";
import { homeFaqs } from "@/lib/content";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <div className="page-container home-page">
      <section className="hero-section" aria-label="AI rap video creator">
        <Generator
          showStyles
          heading={
            <div className="hero-heading">
              <span className="hero-badge">
                <span /> BIG MAIN CHARACTER ENERGY
              </span>
              <h1>
                AI rap video
                <br />
                <span className="headline-serif">generator.</span>
                <Sparkles
                  className="headline-sparkle"
                  size={30}
                  strokeWidth={1.3}
                />
              </h1>
              <p>
                Your face. Your flow. Your moment.
                <br />
                Turn a photo into a video worth replaying.
              </p>
            </div>
          }
        />
      </section>
      <HowItWorks />
      <section className="trend-banner">
        <div>
          <span className="eyebrow">
            <span className="live-dot" /> A DIFFERENT KIND OF MAIN CHARACTER
            MOMENT
          </span>
          <h2>
            You. Them. A whole crowd.
            <br />
            <span className="headline-serif">And that one look.</span>
          </h2>
          <p>Try the I Found You in the Crowd effect with two photos.</p>
          <Link className="button-dark" href="/i-found-you-in-the-crowd">
            Find your person <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="trend-banner-image">
          <img
            src="/images/crowd-scene.jpg"
            alt="A cinematic balcony and crowd scene"
            loading="lazy"
          />
          <span>
            I FOUND YOU
            <br />
            <em>in the crowd.</em>
          </span>
        </div>
      </section>
      <FaqSection items={homeFaqs} />
      <RelatedLinks />
    </div>
  );
}
