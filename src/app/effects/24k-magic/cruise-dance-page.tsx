import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, AudioLines, Camera, Ship, Clock3 } from "lucide-react";
import CruiseGenerator, { type CruiseTemplateVersion } from "@/components/cruise-generator";
import { FaqSection } from "@/components/content-sections";
import { siteName } from "@/lib/site";
import ui from "./page.module.css";

const editions = {
  4: {
    path: "/effects/24k-magic",
    title: "24K Magic Cruise Dance — Put yourself on deck",
    description: "Make a 24K Magic cruise dance video with two photos. Cast the dancer on deck and the partner in the doorway, choose 480p or 720p, and download your video.",
    about: "The dancer steps and kicks across the deck. Their partner leans out of the doorway, glances at the red fire hose cabinet, then raises both hands in the final close-up.",
    format: "The dance runs about 20 seconds in a 16:9 widescreen frame and includes sound. You can choose 480p or 720p before starting.",
  },
  5: {
    path: "/effects/24k-magic/full-length",
    title: "Full-Length 24K Magic Cruise Dance",
    description: "Make the full-length 24K Magic cruise dance with two photos. Recreate the chin pose, kicks and white-blanket scene in a 30-second video with the original audio.",
    about: "The dancer smiles with both hands tucked beside their chin. After the doorway partner spots the red cabinet, the dance returns to the open deck for a split and a high kick beside the partner in a white blanket.",
    format: "The full-length dance runs about 30 seconds in 16:9 with the original audio. Choose 480p or 720p before you generate it.",
  },
} as const;

export function cruiseMetadata(version: CruiseTemplateVersion): Metadata {
  const { title, description, path } = editions[version];
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: false, follow: false },
    openGraph: { type: "website", siteName, title, description, url: path, images: [] },
    twitter: { card: "summary", title, description, images: [] },
  };
}

function cruiseFaqs(version: CruiseTemplateVersion) {
  return [
    {
      question: "What do I need to get started?",
      answer: "Choose a clear photo of each person. The person in the first photo dances on deck. The person in the second photo watches from the doorway.",
    },
    { question: "What happens in the video?", answer: editions[version].about },
    { question: "How long is the finished video?", answer: editions[version].format },
    {
      question: "Is this a free preview?",
      answer:
        "Starting a video uses the connected provider account and may consume credits. You can select and preview both photos before starting.",
    },
  ];
}

export default function CruiseDancePage({ version }: { version: CruiseTemplateVersion }) {
  const fullLength = version === 5;
  return (
    <div className={`page-container ${ui.page}`}>
      <section className={ui.hero} aria-labelledby="cruise-title">
        <div className={ui.heroCopy}>
          <Link className={ui.back} href="/effects/">
            <ArrowLeft size={14} aria-hidden="true" /> All effects
          </Link>
          <p className={ui.eyebrow}><span /> 24K MAGIC · CRUISE DECK DANCE</p>
          <h1 id="cruise-title">{fullLength ? "Full-length" : "Make your own"}<br /><span>24K Magic Cruise Dance.</span></h1>
          <p className={ui.intro}>
            {fullLength
              ? "Cast both roles with your photos. The dancer brings both hands to their chin, then returns to the deck to dance beside their partner in a white blanket."
              : "Cast the 24K Magic cruise dance with two photos. Choose who dances on deck and who watches from the doorway."}
          </p>
          <div className={ui.facts}>
            <span><Camera size={15} aria-hidden="true" /> Two photos</span>
            <span><Clock3 size={15} aria-hidden="true" /> About {fullLength ? 30 : 20} seconds</span>
            <span><AudioLines size={15} aria-hidden="true" /> {fullLength ? "Original audio" : "Sound included"}</span>
          </div>
          <Link className={ui.editionLink} href={editions[fullLength ? 4 : 5].path}>
            {fullLength ? "Use the 20-second version" : "Try the full-length dance"} <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className={ui.templateNote}>
          <div className={ui.shipMark}><Ship size={28} strokeWidth={1.4} aria-hidden="true" /></div>
          <p className={ui.labLabel}>DANCE TEMPLATE</p>
          <h2>Choose your cast.</h2>
          <p>Add one photo for the dancer and another for the partner.</p>
          <a href="#cruise-create">Choose your photos <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </section>

      <CruiseGenerator key={version} templateVersion={version} />

      <section className={ui.tips} aria-label="Photo and video tips">
        <article><span>01 / YOUR PHOTOS</span><h2>Choose a face for each role.</h2><p>Pick a well-lit portrait of the dancer and a separate portrait of the doorway partner. Keep one face clearly visible in each.</p></article>
        <article><span>02 / VIDEO QUALITY</span><h2>Choose a resolution.</h2><p>Use 480p for a smaller video or 720p for more detail on faces and footwork.</p></article>
        <article><span>03 / YOUR RESULT</span><h2>Download your dance.</h2><p>When the video is ready, play it here and download the MP4.</p></article>
      </section>

      <FaqSection items={cruiseFaqs(version)} title="Before you step on deck." />
    </div>
  );
}
