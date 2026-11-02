import Link from "next/link";
import { ArrowUpRight, Check, Plus, Upload, WandSparkles } from "lucide-react";
import type { FaqItem } from "@/lib/content";

export function FaqSection({
  items,
  title = "A few things to know.",
}: {
  items: FaqItem[];
  title?: string;
}) {
  return (
    <section className="section faq-section" aria-labelledby="faq-heading">
      <div className="section-heading">
        <p className="eyebrow">GOOD QUESTIONS</p>
        <h2 id="faq-heading">{title}</h2>
      </div>
      <div className="faq-list">
        {items.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>
              <span>{item.question}</span>
              <Plus size={18} aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks({ crowd = false }: { crowd?: boolean }) {
  const steps = crowd
    ? [
        {
          title: "Two photos. Your story.",
          text: "Choose who looks from the balcony and who stands in the spotlight. Clear portraits work best.",
          icon: Upload,
        },
        {
          title: "Make the moment yours.",
          text: "Pick a couple, friend, pet, or solo scene. Choose the format and let the scene come to life.",
          icon: WandSparkles,
        },
        {
          title: "Preview. Then make it a keeper.",
          text: "Watch your first preview free. Love it? Unlock an available HD download without the watermark.",
          icon: Check,
        },
      ]
    : [
        {
          title: "Start with a photo.",
          text: "Choose a clear portrait from your camera roll, or take one right here. This is your starting frame.",
          icon: Upload,
        },
        {
          title: "Find your energy.",
          text: "Pick rap, dance, or cinematic on the homepage. Choose a format and duration for your clip.",
          icon: WandSparkles,
        },
        {
          title: "Your moment, in motion.",
          text: "Preview your video free. Choose a one-time pack when you want an available HD download without the watermark.",
          icon: Check,
        },
      ];

  return (
    <section className="section" aria-labelledby="how-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FROM PHOTO TO MAIN CHARACTER</p>
          <h2 id="how-heading">A little input. A whole new scene.</h2>
        </div>
      </div>
      <div className="steps-grid">
        {steps.map(({ title, text, icon: Icon }, i) => (
          <article className="step-card" key={title}>
            <div className="step-top">
              <span className="step-number">0{i + 1}</span>
              <Icon size={20} aria-hidden="true" />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <p className="section-note">
        {crowd
          ? "A note on sound: this page creates a silent video. Add your favorite audio afterward in your editor or social app."
          : "Made for your visuals. Clips are silent; add your own track in your favorite video editor."}
      </p>
    </section>
  );
}

export function ComparisonTable() {
  return (
    <section
      className="section comparison-section"
      aria-labelledby="compare-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE SMALL PRINT, UP FRONT</p>
          <h2 id="compare-heading">Know what you are starting with.</h2>
        </div>
        <p className="muted">Free previews, accounts, and watermarks.</p>
      </div>
      <div className="comparison-scroll">
        <table className="comparison-table">
          <caption className="sr-only">
            Free trial, registration, and watermark comparison
          </caption>
          <thead>
            <tr>
              <th scope="col">Tool</th>
              <th scope="col">Free trial</th>
              <th scope="col">Account required</th>
              <th scope="col">Watermark</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">airaptovideo</th>
              <td>First 480p preview</td>
              <td>No</td>
              <td>Free preview; paid HD removes it</td>
            </tr>
            <tr>
              <th scope="row">Runway</th>
              <td>Depends on model</td>
              <td>Yes</td>
              <td>On free outputs</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="section-note">
        Runway&apos;s free credits and eligible tools can change. See its{" "}
        <a
          href="https://help.runwayml.com/hc/en-us/articles/50404627334547-Free-plan-details"
          target="_blank"
          rel="noreferrer"
        >
          official free-plan details
        </a>{" "}
        and{" "}
        <a href="https://runway.com/pricing" target="_blank" rel="noreferrer">
          current plans
        </a>
        . Comparison checked October 24, 2026.
      </p>
    </section>
  );
}

export function RelatedLinks() {
  return (
    <section
      className="section related-links"
      aria-labelledby="related-heading"
    >
      <div>
        <p className="eyebrow">KEEP THE IDEAS COMING</p>
        <h2 id="related-heading">A different kind of main character.</h2>
        <p className="muted">Turn your next photo into a new scene.</p>
      </div>
      <div className="related-link-list">
        <Link href="/">
          AI rap video generator <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <Link href="/dance-rap-video">
          Dance rap video <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <Link href="/music-video-generator">
          AI music video generator <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <Link href="/rap-name-generator">
          Find your rap name <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
