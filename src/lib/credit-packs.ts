export const creditPacks = {
  single: {
    name: "Single",
    amountCents: 799,
    detail: "For that one perfect moment.",
  },
  trio: {
    name: "Trio",
    amountCents: 1990,
    detail: "A few more ideas. A few more takes.",
  },
  party: {
    name: "Party",
    amountCents: 4990,
    detail: "Keep the creative energy going.",
  },
} as const;

export type CreditPackId = keyof typeof creditPacks;
export const creditPackIds = Object.keys(creditPacks) as CreditPackId[];

export function formatPackPrice(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}
