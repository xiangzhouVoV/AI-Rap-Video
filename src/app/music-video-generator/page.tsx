import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Generator from "@/components/generator";
import {
  FaqSection,
  HowItWorks,
  RelatedLinks,
} from "@/components/content-sections";
import type { FaqItem } from "@/lib/content";

export const metadata: Metadata = {
  title: "AI Music Video Generator — Create the visual for your sound",
  description:
    "Turn a photo into a cinematic music-video visual. Create short silent clips, then edit them with your own track. First watermarked preview free.",
  alternates: { canonical: "/music-video-generator" },
};

const faqs: FaqItem[] = [
  {
    question: "Does the AI music video generator make a complete song video?",
    answer:
      "It creates short visual clips from a photo and a cinematic preset. To make a complete music video, generate your shots, download them, and assemble them with your song in a video editor.",
  },
  {
    question: "Can I upload my music?",
    answer:
      "Audio upload and automatic beat synchronization are not part of this version. The clip is silent so you can place it over your own track and control its timing in an editor.",
  },
  {
    question: "What style should I choose for my track?",
    answer:
      "This page starts with the cinematic preset for an atmospheric visual. Explore the effects directory for the rap performance and dance tools if you want a different kind of movement.",
  },
  {
    question: "Can I make a vertical video for social media?",
    answer:
      "Yes. Select 9:16 before generating for vertical framing. You can also choose a square or landscape format. Keep in mind that a longer music-video edit will need additional clips and audio.",
  },
  {
    question: "Do I need to subscribe to download a video?",
    answer:
      "No subscription is needed. Preview your first watermarked 480p clip free and use a one-time credit pack for an available HD download without the watermark.",
  },
];

export default function MusicVideoGeneratorPage() {
  return (
    <div className="page-container">
      <section className="subpage-hero">
        <p className="eyebrow">GIVE YOUR SOUND A SETTING</p>
        <h1>
          AI music video generator.
          <br />
          <span>Start with the feeling.</span>
        </h1>
        <p className="muted">
          Make a cinematic visual from a photo. Create a short silent clip, then
          bring it together with your music in the edit.
        </p>
        <Link className="back-home" href="/">
          Try the AI rap video generator{" "}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
      <Generator initialStyle="cinematic" />
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">MAKE THE VISUAL MATCH THE FEELING</p>
          <h2>Build your video one scene at a time.</h2>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <h3>Find a visual anchor.</h3>
            <p>
              Start with a portrait that fits the track. Think about the
              expression, clothes, and light you want to carry into the scene.
            </p>
          </article>
          <article className="step-card">
            <h3>Keep a consistent mood.</h3>
            <p>
              Use photos with a similar color palette and lighting when you want
              separate shots to feel connected in your edit.
            </p>
          </article>
          <article className="step-card">
            <h3>Cut it to your music.</h3>
            <p>
              Add your track afterward. Trim your shots to the rhythm, and use a
              longer held shot when the song needs space.
            </p>
          </article>
        </div>
        <p className="section-note">
          This tool makes video visuals. Song generation, audio upload,
          automatic beat matching, and lip sync are not included.
        </p>
      </section>
      <HowItWorks />
      <FaqSection items={faqs} title="From the first shot to the final edit." />
      <RelatedLinks />
    </div>
  );
}
