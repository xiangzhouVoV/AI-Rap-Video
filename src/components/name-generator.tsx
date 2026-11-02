"use client";

import { useState, type FormEvent } from "react";
import { Check, Copy, Shuffle, Sparkles } from "lucide-react";
import styles from "./content-sections.module.css";

const wordBanks = {
  smooth: {
    first: [
      "Velvet",
      "Midnight",
      "Satin",
      "Mellow",
      "Silver",
      "Quiet",
      "Cloud",
      "Afterhours",
      "Golden",
      "Silk",
    ],
    last: [
      "Verse",
      "North",
      "Blue",
      "Flow",
      "Saint",
      "Lane",
      "West",
      "Soul",
      "Muse",
      "Waves",
    ],
  },
  punchy: {
    first: [
      "Major",
      "Static",
      "Turbo",
      "Iron",
      "Rebel",
      "Voltage",
      "Rogue",
      "Ace",
      "Bullet",
      "Prime",
    ],
    last: [
      "Knox",
      "Rush",
      "Mode",
      "Kilo",
      "Blaze",
      "Storm",
      "Knock",
      "Impact",
      "Riot",
      "Strike",
    ],
  },
  melodic: {
    first: [
      "Nova",
      "Lunar",
      "Amber",
      "Echo",
      "Halo",
      "Violet",
      "Indigo",
      "Aria",
      "Neon",
      "Solar",
    ],
    last: [
      "Bloom",
      "Skye",
      "Reign",
      "Moon",
      "Haze",
      "Dream",
      "Rose",
      "Dawn",
      "Ray",
      "Sol",
    ],
  },
  offbeat: {
    first: [
      "Cosmic",
      "Pocket",
      "Lucky",
      "Disco",
      "Pixel",
      "Leftfield",
      "Fuzzy",
      "Mango",
      "Odd",
      "Electric",
    ],
    last: [
      "Theory",
      "Orbit",
      "Tempo",
      "Radio",
      "Comet",
      "Frequency",
      "Poet",
      "Peach",
      "Lunch",
      "Signal",
    ],
  },
};

type Vibe = keyof typeof wordBanks;
const starterNames = [
  "Nova North",
  "Velvet Verse",
  "Echo Saint",
  "Major Skye",
  "Cosmic Flow",
  "Indigo Reign",
];

function pick(items: string[]) {
  const random = new Uint32Array(1);
  window.crypto.getRandomValues(random);
  return items[random[0] % items.length];
}

function makeNames(vibe: Vibe, base: string, previous: string[]) {
  const bank = wordBanks[vibe];
  const cleanBase = base.trim().replace(/\s+/g, " ").slice(0, 24);
  const names = new Set<string>();
  let tries = 0;
  while (names.size < 6 && tries < 300) {
    const name = cleanBase
      ? names.size % 2 === 0
        ? `${pick(bank.first)} ${cleanBase}`
        : `${cleanBase} ${pick(bank.last)}`
      : `${pick(bank.first)} ${pick(bank.last)}`;
    if (!previous.includes(name)) names.add(name);
    tries++;
  }
  return [...names];
}

export default function NameGenerator() {
  const [base, setBase] = useState("");
  const [vibe, setVibe] = useState<Vibe>("melodic");
  const [names, setNames] = useState(starterNames);
  const [copied, setCopied] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function generate(event: FormEvent) {
    event.preventDefault();
    const next = makeNames(vibe, base, names);
    setNames(next);
    setCopied(null);
    setMessage("Six new names, ready to try on.");
  }

  async function copyName(name: string) {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(name);
      setMessage(`${name} copied.`);
    } catch {
      setMessage(
        "Copy is unavailable in this browser. Select a name to copy it manually.",
      );
    }
  }

  return (
    <section
      className={`name-tool ${styles.nameTool}`}
      aria-labelledby="name-tool-heading"
    >
      <div className={styles.toolIntro}>
        <span className="eyebrow">
          <Sparkles size={14} aria-hidden="true" /> YOUR NEXT ALIAS
        </span>
        <span className={styles.freeLabel}>Always free</span>
      </div>
      <h2 id="name-tool-heading">Try a name on.</h2>
      <p className="muted">
        Choose a vibe. Add your name if you want. See what sticks.
      </p>
      <form className={styles.nameForm} onSubmit={generate}>
        <label className="field-label" htmlFor="name-base">
          Your name or nickname{" "}
          <span className={styles.optional}>(optional)</span>
          <input
            id="name-base"
            className={styles.nameInput}
            value={base}
            onChange={(event) => setBase(event.target.value)}
            maxLength={24}
            placeholder="e.g. Alex"
            autoComplete="off"
          />
        </label>
        <label className="field-label" htmlFor="name-vibe">
          Your energy
          <select
            id="name-vibe"
            className={styles.nameInput}
            value={vibe}
            onChange={(event) => setVibe(event.target.value as Vibe)}
          >
            <option value="melodic">Melodic &amp; dreamy</option>
            <option value="punchy">Bold &amp; punchy</option>
            <option value="smooth">Smooth &amp; laid-back</option>
            <option value="offbeat">A little left field</option>
          </select>
        </label>
        <button className="button-primary" type="submit">
          <Shuffle size={17} aria-hidden="true" /> Generate names
        </button>
      </form>
      <div
        className={`name-results ${styles.nameResults}`}
        aria-label="Rap name ideas"
      >
        {names.map((name, i) => (
          <div className={styles.nameResult} key={name}>
            <span className={styles.nameIndex}>0{i + 1}</span>
            <strong>{name}</strong>
            <button
              className={styles.copyButton}
              type="button"
              onClick={() => void copyName(name)}
              aria-label={copied === name ? `${name} copied` : `Copy ${name}`}
            >
              {copied === name ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <Copy size={17} aria-hidden="true" />
              )}
            </button>
          </div>
        ))}
      </div>
      <p className={styles.nameMessage} aria-live="polite" role="status">
        {message || "Made in your browser. No signup or credits needed."}
      </p>
    </section>
  );
}
