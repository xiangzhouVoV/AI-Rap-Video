import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, VolumeX } from "lucide-react";
import Generator from "@/components/generator";
import {
  ComparisonTable,
  FaqSection,
  HowItWorks,
  RelatedLinks,
} from "@/components/content-sections";
import { crowdFaqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "I Found You in the Crowd AI Video — Two Photos, One Cinematic Look",
  description:
    "Make the I Found You in the Crowd AI video effect with two photos. Choose a couple, friends, pet, or solo scene. Your first silent video is free.",
  alternates: { canonical: "/i-found-you-in-the-crowd" },
};

export default function CrowdPage() {
  return (
    <div className="page-container crowd-page">
      <section className="hero-section">
        <Generator
          mode="crowd"
          showVariants
          heading={
            <div className="hero-heading">
              <Link className="back-link" href="/">
                <ArrowLeft size={13} /> AI rap video generator
              </Link>
              <span className="hero-badge">
                <span /> THE LOOK THAT SAYS EVERYTHING
              </span>
              <h1>
                I found you
                <br />
                <span className="headline-serif">in the crowd.</span>
              </h1>
              <p>
                One person on a balcony. One face in the spotlight.
                <br />
                Turn two photos into a cinematic, across-the-crowd look.
              </p>
              <span className="silent-note">
                <VolumeX size={14} /> A silent scene. Add your favorite sound
                when you post.
              </span>
            </div>
          }
        />
      </section>
      <HowItWorks crowd />
      <ComparisonTable />
      <FaqSection
        items={crowdFaqs}
        title="A few things you might be wondering."
      />
      <RelatedLinks />
    </div>
  );
}
