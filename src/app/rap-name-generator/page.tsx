import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import NameGenerator from "@/components/name-generator";
import { FaqSection, RelatedLinks } from "@/components/content-sections";
import type { FaqItem } from "@/lib/content";

export const metadata: Metadata = {
  title: "Free Rap Name Generator — Find your next alias",
  description:
    "Find a rap name that fits your energy. Add a nickname, choose your vibe, and generate six ideas instantly. Free, local, and no signup required.",
  alternates: { canonical: "/rap-name-generator" },
};

const faqs: FaqItem[] = [
  {
    question: "How does this rap name generator work?",
    answer:
      "Choose an energy and optionally enter a name or nickname. The generator combines words from that style into six suggestions. Generate again to get a different set, or copy a name you want to keep.",
  },
  {
    question: "Is the rap name generator free?",
    answer:
      "Yes. Name generation and copying are free, with no account or video credits needed. You can try as many batches as you want.",
  },
  {
    question: "Can I use my real name in the suggestions?",
    answer:
      "Yes. Enter up to 24 characters in the name or nickname field. The generator will pair your entry with words that match the energy you choose. Leave the field blank for entirely new combinations.",
  },
  {
    question: "Does my nickname get uploaded?",
    answer:
      "No. This name tool runs in your browser and does not send the name you type to the video-generation service. Copying uses your browser clipboard permission.",
  },
  {
    question: "Are these names unique?",
    answer:
      "The suggestions are word combinations, so someone else may already use one. Search your favorite choice before using it as an artist name or a social handle.",
  },
];

export default function RapNameGeneratorPage() {
  return (
    <div className="page-container">
      <section className="subpage-hero">
        <p className="eyebrow">BEFORE THE FIRST VERSE</p>
        <h1>
          Rap name generator.
          <br />
          <span>Find your other name.</span>
        </h1>
        <p className="muted">
          Smooth, bold, dreamy, or a little unexpected. Find an alias that
          sounds like your next era.
        </p>
        <Link className="back-home" href="/">
          Bring it to life with the AI rap video generator{" "}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
      <NameGenerator />
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2>The right name has a little you in it.</h2>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <h3>Start with your energy.</h3>
            <p>
              A soft, melodic sound might suit a name with open vowels. Short,
              sharp words can feel more direct. Say a few suggestions out loud.
            </p>
          </article>
          <article className="step-card">
            <h3>Bring something personal.</h3>
            <p>
              Try a nickname, a favorite color, or a place that means something
              to you. A detail from your own story helps a name stick.
            </p>
          </article>
          <article className="step-card">
            <h3>Picture it on the cover.</h3>
            <p>
              Keep your favorite names and imagine each one on cover art, a
              video title, or a social handle. Choose the one you want people to
              remember.
            </p>
          </article>
        </div>
      </section>
      <FaqSection items={faqs} title="A name for your next chapter." />
      <RelatedLinks />
    </div>
  );
}
