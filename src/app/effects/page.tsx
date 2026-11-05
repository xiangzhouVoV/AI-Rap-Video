import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Ship, Waves } from "lucide-react";
import { styles } from "@/lib/content";
import { RelatedLinks } from "@/components/content-sections";
import ui from "./effects.module.css";

export const metadata: Metadata = {
  title: "AI Video Effects — Find your next scene",
  description:
    "Explore AI video effects for your photos: I Found You in the Crowd, rap, dance, and cinematic scenes. Pick an effect and make your first preview free.",
  alternates: { canonical: "/effects/" },
};

const destinations: Record<string, string> = {
  rap: "/rap-video",
  dance: "/dance-rap-video",
  cinematic: "/music-video-generator",
  crowd: "/i-found-you-in-the-crowd",
};

export default function EffectsPage() {
  return (
    <div className="page-container">
      <section className="subpage-hero">
        <p className="eyebrow">A NEW WAY TO SEE YOURSELF</p>
        <h1>
          AI video effects.
          <br />
          <span>Find your next scene.</span>
        </h1>
        <p className="muted">
          A crowded street. A stage light. A little main character energy.
          Choose where your photo takes you.
        </p>
        <Link className="back-home" href="/">
          Start with the AI rap video generator{" "}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
      <section className="section" aria-label="Explore available effects">
        <Link className={ui.labCard} href="/effects/24k-magic">
          <div className={ui.labArtwork} aria-hidden="true"><Ship size={37} strokeWidth={1.2} /><Waves size={68} strokeWidth={.8} /><span>24K</span></div>
          <div className={ui.labCopy}><span className={ui.labBadge}>TEMPLATE LAB · EXPERIMENTAL</span><h2>24K Magic. Your moment on deck.</h2><p>Cast the deck dancer and the doorway partner with two photos to make your own 24K Magic dance video.</p><span className={ui.labLink}>Explore the cruise dance <ArrowUpRight size={14} aria-hidden="true" /></span></div>
        </Link>
        <div className="effect-grid">
          {[styles[3], ...styles.slice(0, 3)].map((style) => (
            <Link
              className="effect-card"
              href={destinations[style.id]}
              key={style.id}
            >
              <div className="effect-card-image">
                <img
                  src={style.image}
                  alt={
                    style.id === "crowd"
                      ? "A person on a balcony finding someone in a spotlight below"
                      : `${style.title} visual style inspiration`
                  }
                  width={768}
                  height={1024}
                />
                <span className="effect-tag">{style.tag}</span>
                <span className="effect-arrow">
                  <ArrowUpRight size={21} aria-hidden="true" />
                </span>
              </div>
              <div className="effect-card-copy">
                <h2>{style.title}</h2>
                <p>{style.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">SAME PHOTO. NEW POSSIBILITIES.</p>
          <h2>Choose a scene that feels like you.</h2>
        </div>
        <p className="muted">
          Each effect begins with your photo and a style preset. For the I Found
          You in the Crowd effect, bring two photos to place your subjects in
          the balcony and spotlight roles. For rap, dance, and cinematic
          visuals, start with one portrait and choose your format.
        </p>
        <p className="section-note">
          Style images are visual inspiration. Generated motion, framing, and
          appearance vary with your inputs and the selected model.
        </p>
      </section>
      <RelatedLinks />
    </div>
  );
}
