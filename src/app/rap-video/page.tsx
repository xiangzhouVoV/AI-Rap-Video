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
  title: "AI Rap Video — Put yourself in the scene",
  description:
    "Make an AI rap video from your photo. Set the mood, choose a format, and create a short visual for your next edit. First preview free; one-time packs.",
  alternates: { canonical: "/rap-video" },
};

const faqs: FaqItem[] = [
  {
    question: "What can I make with an AI rap video?",
    answer:
      "Create a short visual centered on the person in your photo. The rap preset gives the clip a performance-inspired look. Use the result as a visual clip in a larger edit.",
  },
  {
    question: "Will the person rap or lip sync to my song?",
    answer:
      "This version creates the visual scene and does not accept a song or a vocal track. It does not generate rap vocals or accurate lip sync. Add your audio in a separate editor after downloading.",
  },
  {
    question: "Can I write a custom scene description?",
    answer:
      "This version uses a rap preset for the scene direction. You choose the photo, aspect ratio, duration, and model. Custom text prompts are not available in the current tool.",
  },
  {
    question: "Can I make a whole music video?",
    answer:
      "The generator creates short clips rather than a complete multi-scene music video. You can create individual shots and assemble them with your track in a video editor.",
  },
  {
    question: "Is there a monthly subscription?",
    answer:
      "No. The site uses one-time credit packs. Start with your first free watermarked preview, then choose a pack if you want an available HD download without the watermark.",
  },
];

export default function RapVideoPage() {
  return (
    <div className="page-container">
      <section className="subpage-hero">
        <p className="eyebrow">YOUR CLOSE-UP IS CALLING</p>
        <h1>
          Make an AI rap video.
          <br />
          <span>Own the scene.</span>
        </h1>
        <p className="muted">
          From a camera-roll photo to a rap-inspired visual. Choose your
          portrait, pick a format, and put yourself in the frame.
        </p>
        <Link className="back-home" href="/">
          Back to the AI rap video generator{" "}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
      <Generator initialStyle="rap" />
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">THINK IN SHOTS</p>
          <h2>Your portrait is the starting point.</h2>
          <p className="muted">
            A clear reference helps give your short scene a consistent focus.
          </p>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <h3>Choose a clear reference.</h3>
            <p>
              A well-lit portrait with one visible face gives the model a
              straightforward starting point for the performance-inspired scene.
            </p>
          </article>
          <article className="step-card">
            <h3>Frame your moment.</h3>
            <p>
              Choose vertical for a phone screen, landscape for a wider edit, or
              square for a centered composition.
            </p>
          </article>
          <article className="step-card">
            <h3>Finish with your sound.</h3>
            <p>
              The output is a silent visual. Put it over your track, then add
              cuts, captions, or cover art in your editor.
            </p>
          </article>
        </div>
      </section>
      <HowItWorks />
      <FaqSection items={faqs} title="Your scene, explained." />
      <RelatedLinks />
    </div>
  );
}
