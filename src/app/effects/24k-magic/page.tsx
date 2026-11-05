import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, AudioLines, Camera, Ship, Waves } from "lucide-react";
import CruiseGenerator from "@/components/cruise-generator";
import { FaqSection } from "@/components/content-sections";
import { siteName } from "@/lib/site";
import ui from "./page.module.css";

const title = "24K Magic Cruise Dance — Put yourself on deck";
const description =
  "Try a cruise-deck dance with your photo and a motion reference. Review the prompt, choose your settings, and follow a real video generation in this experimental template.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/effects/24k-magic" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName,
    title,
    description,
    url: "/effects/24k-magic",
    images: [],
  },
  twitter: { card: "summary", title, description, images: [] },
};

const faqs = [
  {
    question: "What do I need to get started?",
    answer:
      "Use one clear photo of yourself and a reference clip for the dance. A well-lit photo that shows your whole body gives the model more visual information. Use only material you have permission to upload and transform.",
  },
  {
    question: "Will it reproduce the exact dance?",
    answer:
      "The reference guides the motion, while your photo guides the subject. This template is still being tested: choreography, facial likeness, framing, and movement can vary between generations.",
  },
  {
    question: "Does it include the original 24K Magic song?",
    answer:
      "Audio generation is enabled, but the original song, recording, and exact beat synchronization are not guaranteed. Listen to the generated result before deciding whether to add your own permitted audio in an editor.",
  },
  {
    question: "Is this a free preview?",
    answer:
      "This is a real-generation debugging page. Starting a generation uses the connected provider account and may consume its credits. The page does not offer a free allowance, sell a credit pack, or promise a refund.",
  },
];

export default function CruiseDancePage() {
  return (
    <div className={`page-container ${ui.page}`}>
      <section className={ui.hero} aria-labelledby="cruise-title">
        <div className={ui.heroCopy}>
          <Link className={ui.back} href="/effects/">
            <ArrowLeft size={14} aria-hidden="true" /> All effects
          </Link>
          <p className={ui.eyebrow}><span /> 24K MAGIC · CRUISE DECK DANCE</p>
          <h1 id="cruise-title">Your moment.<br /><span>On deck.</span></h1>
          <p className={ui.intro}>
            Ocean air. Golden light. Your next move.<br />
            Step into a cruise-deck dance with your own photo.
          </p>
          <div className={ui.facts}>
            <span><Camera size={15} aria-hidden="true" /> One photo</span>
            <span><Waves size={15} aria-hidden="true" /> Reference-guided motion</span>
            <span><AudioLines size={15} aria-hidden="true" /> Audio on</span>
          </div>
        </div>
        <div className={ui.templateNote}>
          <div className={ui.shipMark}><Ship size={28} strokeWidth={1.4} aria-hidden="true" /></div>
          <p className={ui.labLabel}>TEMPLATE LAB / 001</p>
          <h2>A new scene, in the making.</h2>
          <p>Review your photo, reference, and settings before starting a real generation.</p>
          <a href="#cruise-create">Open the generation lab <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </section>

      <CruiseGenerator />

      <section className={ui.tips} aria-label="Photo and reference tips">
        <article><span>01 / YOUR PHOTO</span><h2>Give your moves some room.</h2><p>Use a sharp, well-lit photo with one person. Show your whole body when possible.</p></article>
        <article><span>02 / THE REFERENCE</span><h2>Set the scene in motion.</h2><p>Preview the actual reference clip. It guides the movement and the cruise-deck atmosphere.</p></article>
        <article><span>03 / YOUR RESULT</span><h2>Watch. Listen. Refine.</h2><p>Check identity, choreography, and audio. Adjust the prompt before choosing to run another generation.</p></article>
      </section>

      <FaqSection items={faqs} title="Before you step on deck." />
    </div>
  );
}
