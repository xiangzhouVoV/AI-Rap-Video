export const cruisePaths = {
  4: "/effects/24k-magic/cartoon",
  5: "/effects/24k-magic",
} as const;

export type CruiseTemplateVersion = keyof typeof cruisePaths;
