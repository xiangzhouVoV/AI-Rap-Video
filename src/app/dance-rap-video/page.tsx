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
  title: "AI Dance Rap Video — Give your photo some energy",
  description:
    "Create an AI dance rap video from a portrait. Choose your scene and framing, preview your first clip free, then add your own beat. No subscription.",
  alternates: { canonical: "/dance-rap-video" },
};

const faqs: FaqItem[] = [
  {
    question: "What is an AI dance rap video?",
    answer:
      "It is a short AI-generated visual with dance-inspired movement and a rap-video look. Your photo provides the subject, and the dance preset supplies the scene direction for the clip.",
  },
  {
    question: "Do I need to record myself dancing?",
    answer:
      "No. Start with a still photo. A clear portrait or a photo that shows more of your body gives the model a visual reference. The dance preset supplies the movement direction.",
  },
  {
    question: "Can it copy an exact dance?",
    answer:
      "This tool creates motion from a photo and a dance preset. It does not take a reference dance video, so exact choreography and repeated moves are not guaranteed.",
  },
  {
    question: "Is a rap song included?",
    answer:
      "The generated clip is silent. Add a beat or a track afterward in your video editor. If you want movement to land on specific beats, trim the clip and align it to your audio while editing.",
  },
  {
    question: "Can I try it before buying?",
    answer:
      "Your first 480p preview is free with a watermark. Watch the result before choosing a one-time credit pack for an available HD download without the watermark.",
  },
];

export default function DanceRapVideoPage() {
  return (
    <div className="page-container">
      <section className="subpage-hero">
        <p className="eyebrow">A LITTLE MORE MOVEMENT</p>
        <h1>
          AI dance rap video.
          <br />
          <span>Your photo has rhythm.</span>
        </h1>
        <p className="muted">
          Turn a still portrait into a short, dance-inspired scene. Bring the
          attitude. Add your favorite beat afterward.
        </p>
        <Link className="back-home" href="/">
          Explore the AI rap video generator{" "}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
      <Generator initialStyle="dance" />
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">DIRECT YOUR ENERGY</p>
          <h2>One photo. A few ways to move.</h2>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <h3>Give movement some room.</h3>
            <p>
              A portrait that shows your shoulders or more of your body gives
              the model a clearer starting point for a dance-inspired clip.
            </p>
          </article>
          <article className="step-card">
            <h3>Keep your face in focus.</h3>
            <p>
              Choose even lighting and a simple background. Avoid several faces
              in one image so your subject is easy to identify.
            </p>
          </article>
          <article className="step-card">
            <h3>Leave room for the beat.</h3>
            <p>
              Choose vertical for a phone-first clip. Add audio and time your
              cut to the drop in your video editor.
            </p>
          </article>
        </div>
      </section>
      <HowItWorks />
      <FaqSection items={faqs} title="Before you make your move." />
      <RelatedLinks />
    </div>
  );
}
