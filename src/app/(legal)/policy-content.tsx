import type { Metadata } from "next";
import type { LegalPolicy } from "@/content/legal/policy";
import { siteUrl } from "@/lib/site";

const updated = "2026-11-05";

export function policyMetadata(policy: LegalPolicy): Metadata {
  return {
    title: policy.title,
    description: policy.description,
    alternates: { canonical: policy.path },
  };
}

export default function PolicyContent({ policy }: { policy: LegalPolicy }) {
  const article = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: policy.title,
    url: new URL(policy.path, siteUrl).href,
    dateModified: updated,
    description: policy.description,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }} />
      <header>
        <h1>{policy.title}</h1>
        <p>Last updated: <time dateTime={updated}>November 5, 2026</time></p>
      </header>
      <p>{policy.intro}</p>
      {policy.sections.map(({ heading, paragraphs, links, table }) => (
        <section key={heading}>
          <h2>{heading}</h2>
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {table && (
            <table aria-label={heading}>
              <thead><tr>{table.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
              <tbody>
                {table.rows.map(([name, ...cells]) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    {cells.map((cell, i) => <td key={table.columns[i + 1]}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {links?.map(({ href, label }) => <p key={href}><a href={href}>{label}</a></p>)}
        </section>
      ))}
    </>
  );
}
