// State-level upward-mobility dataset.
//
// Source: src/data/mobility.real.json — generated at build time by
// `npm run fetch-atlas` from the Opportunity Insights tract-level extract:
//   https://opportunityinsights.org/wp-content/uploads/2018/10/tract_outcomes_simple.csv
//
// Values are mean household income rank (0–100) at age ~30 for children whose
// parents were at the 25th percentile of the national income distribution
// (variable kfr_<race>_<sex>_p25), aggregated from census tract to state via
// population-weighted averaging using the Atlas sample counts.
//
// Available cells in this extract: parental income p25 only; race ∈
// {all, white, black, hispanic} (no Asian); sex ∈ {all, male, female}.
// Filter UI hides combinations the data does not support.

import realData from "./mobility.real.json";

export type Race = "all" | "white" | "black" | "hispanic" | "asian";
export type Sex = "all" | "male" | "female";
export type IncomeGroup = "p25" | "p50" | "p75";

export interface StateRecord {
  code: string;
  name: string;
  // mobility[income][race][sex] = rank (0–100), or null if unavailable
  mobility: Record<
    IncomeGroup,
    Partial<Record<Race, Partial<Record<Sex, number | null>>>>
  >;
  cohort: { year: number; rank: number }[];
  population: number;
}

// Available filter cells — drives the UI controls.
export const AVAILABLE_INCOME: IncomeGroup[] = ["p25"];
export const AVAILABLE_RACE: Race[] = ["all", "white", "black", "hispanic"];
export const AVAILABLE_SEX: Sex[] = ["all", "male", "female"];

// Tile cartogram coordinates (col, row), inspired by NPR/WaPo style grids.
export const TILE_LAYOUT: Record<string, { col: number; row: number; name: string }> = {
  AK: { col: 0, row: 0, name: "Alaska" },
  ME: { col: 11, row: 0, name: "Maine" },
  VT: { col: 10, row: 1, name: "Vermont" },
  NH: { col: 11, row: 1, name: "New Hampshire" },
  WA: { col: 1, row: 1, name: "Washington" },
  MT: { col: 3, row: 1, name: "Montana" },
  ND: { col: 4, row: 1, name: "North Dakota" },
  MN: { col: 5, row: 1, name: "Minnesota" },
  WI: { col: 6, row: 1, name: "Wisconsin" },
  MI: { col: 8, row: 1, name: "Michigan" },
  NY: { col: 9, row: 1, name: "New York" },
  MA: { col: 10, row: 2, name: "Massachusetts" },
  RI: { col: 11, row: 2, name: "Rhode Island" },
  ID: { col: 2, row: 2, name: "Idaho" },
  OR: { col: 1, row: 2, name: "Oregon" },
  WY: { col: 3, row: 2, name: "Wyoming" },
  SD: { col: 4, row: 2, name: "South Dakota" },
  IA: { col: 5, row: 2, name: "Iowa" },
  IL: { col: 6, row: 2, name: "Illinois" },
  IN: { col: 7, row: 2, name: "Indiana" },
  OH: { col: 8, row: 2, name: "Ohio" },
  PA: { col: 9, row: 2, name: "Pennsylvania" },
  NJ: { col: 10, row: 3, name: "New Jersey" },
  CT: { col: 11, row: 3, name: "Connecticut" },
  CA: { col: 1, row: 3, name: "California" },
  NV: { col: 2, row: 3, name: "Nevada" },
  UT: { col: 3, row: 3, name: "Utah" },
  CO: { col: 4, row: 3, name: "Colorado" },
  NE: { col: 5, row: 3, name: "Nebraska" },
  MO: { col: 6, row: 3, name: "Missouri" },
  KY: { col: 7, row: 3, name: "Kentucky" },
  WV: { col: 8, row: 3, name: "West Virginia" },
  VA: { col: 9, row: 3, name: "Virginia" },
  MD: { col: 10, row: 4, name: "Maryland" },
  DE: { col: 11, row: 4, name: "Delaware" },
  AZ: { col: 3, row: 4, name: "Arizona" },
  NM: { col: 4, row: 4, name: "New Mexico" },
  KS: { col: 5, row: 4, name: "Kansas" },
  AR: { col: 6, row: 4, name: "Arkansas" },
  TN: { col: 7, row: 4, name: "Tennessee" },
  NC: { col: 8, row: 4, name: "North Carolina" },
  SC: { col: 9, row: 4, name: "South Carolina" },
  HI: { col: 0, row: 5, name: "Hawaii" },
  OK: { col: 5, row: 5, name: "Oklahoma" },
  LA: { col: 6, row: 5, name: "Louisiana" },
  MS: { col: 7, row: 5, name: "Mississippi" },
  AL: { col: 8, row: 5, name: "Alabama" },
  GA: { col: 9, row: 5, name: "Georgia" },
  TX: { col: 4, row: 5, name: "Texas" },
  FL: { col: 10, row: 6, name: "Florida" },
  DC: { col: 9, row: 4.5, name: "District of Columbia" },
};

interface RawRecord {
  code: string;
  name: string;
  mobility: { p25: Record<string, Record<string, number | null>> };
  cohort: { year: number; rank: number }[];
  population: number;
}

const raw = realData as { source: string; generatedAt: string; states: RawRecord[] };

export const DATA_SOURCE_URL = raw.source;
export const DATA_GENERATED_AT = raw.generatedAt;

export const STATES: StateRecord[] = raw.states.map((s) => ({
  code: s.code,
  name: s.name,
  mobility: { p25: s.mobility.p25, p50: {}, p75: {} } as StateRecord["mobility"],
  cohort: s.cohort,
  population: s.population,
}));

export const STATES_BY_CODE: Record<string, StateRecord> = Object.fromEntries(
  STATES.map((s) => [s.code, s]),
);

/** Lookup with graceful fallback for unavailable cells. */
export function valueFor(
  s: StateRecord,
  income: IncomeGroup,
  race: Race,
  sex: Sex,
): number | null {
  const row = s.mobility[income];
  if (!row) return null;
  const v = row[race]?.[sex];
  return v ?? null;
}

/** Population-weighted national average across states with available data. */
export const NATIONAL_AVG = (income: IncomeGroup, race: Race, sex: Sex): number => {
  let num = 0;
  let den = 0;
  for (const s of STATES) {
    const v = valueFor(s, income, race, sex);
    if (v == null) continue;
    num += v * s.population;
    den += s.population;
  }
  return den > 0 ? +(num / den).toFixed(1) : 0;
};
