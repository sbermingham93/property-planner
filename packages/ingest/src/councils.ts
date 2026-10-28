/**
 * Planning authorities in scope for the pilot.
 *
 * `datasetName` must match the `PlanningAuthority` value in the national
 * IrishPlanningApplications dataset exactly, since it is used in query filters.
 */
export const PILOT_COUNCILS = [
  { slug: "dublin-city", datasetName: "Dublin City Council", county: "Dublin" },
  {
    slug: "dun-laoghaire-rathdown",
    datasetName: "Dun Laoghaire Rathdown County Council",
    county: "Dublin",
  },
  { slug: "fingal", datasetName: "Fingal County Council", county: "Dublin" },
  { slug: "south-dublin", datasetName: "South Dublin County Council", county: "Dublin" },
  { slug: "wexford", datasetName: "Wexford County Council", county: "Wexford" },
  { slug: "wicklow", datasetName: "Wicklow County Council", county: "Wicklow" },
] as const;

export type Council = (typeof PILOT_COUNCILS)[number];
export type CouncilSlug = Council["slug"];

export function findCouncil(slug: string): Council | undefined {
  return PILOT_COUNCILS.find((council) => council.slug === slug);
}
