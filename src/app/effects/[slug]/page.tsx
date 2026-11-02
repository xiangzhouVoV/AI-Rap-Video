import { notFound } from "next/navigation";

// New trend pages belong here only when an effect has been implemented.
// The existing crowd effect keeps its canonical root-level URL.
export default async function FutureEffectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  notFound();
}
