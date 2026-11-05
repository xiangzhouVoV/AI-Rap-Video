import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, AudioLines, Camera, Ship, Waves } from "lucide-react";
import CruiseGenerator from "@/components/cruise-generator";
import { FaqSection } from "@/components/content-sections";
import { siteName } from "@/lib/site";
import ui from "./page.module.css";

const title = "24K Magic Cruise Dance — Put yourself on deck";
const description =
  "Cast two people in the 24K Magic cruise dance. Add a photo for the dancer and one for the partner, review your motion reference, and generate your video.";

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
      "Choose a clear, single-person photo for each role. Photo 1 plays the dancer in the yellow coverall. Photo 2 plays the partner in the shirt and tie who later peeks out from under the blanket. Review the dance reference before generating.",
  },
  {
    question: "Will it reproduce the exact dance?",
    answer:
      "The video reference guides the motion and each photo guides its own character’s appearance. Choreography, facial likeness and framing can vary between generations.",
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
            Cast the 24K Magic cruise dance with two photos. Choose who dances on deck and who peeks out from under the blanket.
          </p>
          <div className={ui.facts}>
            <span><Camera size={15} aria-hidden="true" /> Two photos</span>
            <span><Waves size={15} aria-hidden="true" /> Reference-guided motion</span>
            <span><AudioLines size={15} aria-hidden="true" /> Audio on</span>
          </div>
        </div>
        <div className={ui.templateNote}>
          <div className={ui.shipMark}><Ship size={28} strokeWidth={1.4} aria-hidden="true" /></div>
          <p className={ui.labLabel}>TEMPLATE LAB / 001</p>
          <h2>A new scene, in the making.</h2>
          <p>Review both photos, the reference, and your settings before starting a real generation.</p>
          <a href="#cruise-create">Open the generation lab <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </section>

      <CruiseGenerator />

      <section className={ui.tips} aria-label="Photo and reference tips">
        <article><span>01 / YOUR PHOTOS</span><h2>Choose a face for each role.</h2><p>Pick a well-lit portrait of the dancer and a separate portrait of the blanket partner. Keep one face clearly visible in each.</p></article>
        <article><span>02 / THE REFERENCE</span><h2>Set the scene in motion.</h2><p>Preview the actual reference clip. It guides the movement and the cruise-deck atmosphere.</p></article>
        <article><span>03 / YOUR RESULT</span><h2>Watch. Listen. Refine.</h2><p>Check identity, choreography, and audio. Adjust the prompt before choosing to run another generation.</p></article>
      </section>

      <FaqSection items={faqs} title="Before you step on deck." />
    </div>
  );
}
