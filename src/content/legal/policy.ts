import { supportEmail } from "@/lib/site";

export type LegalPolicy = {
  path: string;
  title: string;
  description: string;
  intro: string;
  sections: {
    heading: string;
    paragraphs: string[];
    links?: { label: string; href: string }[];
    table?: {
      columns: string[];
      rows: string[][];
    };
  }[];
};

export const supportLink = {
  label: supportEmail,
  href: `mailto:${supportEmail}`,
};
