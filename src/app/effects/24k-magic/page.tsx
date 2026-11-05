import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, AudioLines, Camera, Ship, Clock3 } from "lucide-react";
import CruiseGenerator from "@/components/cruise-generator";
import { FaqSection } from "@/components/content-sections";
import { siteName } from "@/lib/site";
import ui from "./page.module.css";

const title = "24K Magic Cruise Dance — Put yourself on deck";
const description =
  "Make a 24K Magic cruise dance video with two photos. Cast your dancer and their blanket-wrapped partner, choose a resolution, and download the finished dance.";

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
      "Choose a clear, single-person photo for each role. Photo 1 plays the dancer in the yellow coverall. Photo 2 plays the partner in the shirt and tie who later peeks out from under the blanket.",
  },
  {
    question: "What happens in the video?",
    answer:
      "The dancer steps across the ship’s deck and drops into a split. Their partner watches from the doorway and peeks out from a white blanket in the final shot.",
  },
  {
    question: "How long is the finished video?",
    answer:
      "The dance runs about 27 seconds in a 4:3 landscape frame. You can choose 480p or 720p before starting.",
  },
  {
    question: "Is this a free preview?",
    answer:
      "Starting a video uses the connected provider account and may consume credits. You can select and preview both photos before starting.",
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
          <h1 id="cruise-title">Make your own<br /><span>24K Magic Cruise Dance.</span></h1>
          <p className={ui.intro}>
            Cast the 24K Magic cruise dance with two photos. Choose who dances on deck and who peeks out from under the blanket.
          </p>
          <div className={ui.facts}>
            <span><Camera size={15} aria-hidden="true" /> Two photos</span>
            <span><Clock3 size={15} aria-hidden="true" /> About 27 seconds</span>
            <span><AudioLines size={15} aria-hidden="true" /> Sound included</span>
          </div>
        </div>
        <div className={ui.templateNote}>
          <div className={ui.shipMark}><Ship size={28} strokeWidth={1.4} aria-hidden="true" /></div>
          <p className={ui.labLabel}>DANCE TEMPLATE</p>
          <h2>Choose your cast.</h2>
          <p>Add one photo for the dancer and another for the partner.</p>
          <a href="#cruise-create">Choose your photos <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </section>

      <CruiseGenerator />

      <section className={ui.tips} aria-label="Photo and video tips">
        <article><span>01 / YOUR PHOTOS</span><h2>Choose a face for each role.</h2><p>Pick a well-lit portrait of the dancer and a separate portrait of the blanket partner. Keep one face clearly visible in each.</p></article>
        <article><span>02 / VIDEO QUALITY</span><h2>Choose a resolution.</h2><p>Use 480p for a smaller video or 720p for more detail on faces and footwork.</p></article>
        <article><span>03 / YOUR RESULT</span><h2>Download your dance.</h2><p>When the video is ready, play it here and download the MP4.</p></article>
      </section>

      <FaqSection items={faqs} title="Before you step on deck." />
    </div>
  );
}
