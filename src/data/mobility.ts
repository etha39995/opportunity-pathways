// Mock dataset modeled on Opportunity Atlas state-level patterns.
// Values are household income rank (0-100) at age 35 for children
// raised by parents at the given income percentile. Higher = more upward mobility.
// Patterns intentionally echo published findings (higher in Plains/Upper Midwest,
// lower in much of the Southeast). Replace with real OA extracts when wiring up data.

export type Race = "all" | "white" | "black" | "hispanic" | "asian";
export type Sex = "all" | "male" | "female";
export type IncomeGroup = "p25" | "p50" | "p75";

export interface StateRecord {
  code: string;
  name: string;
  // mobility[income][race][sex] = rank
  mobility: Record<IncomeGroup, Record<Race, Record<Sex, number>>>;
  // cohort trend: mean rank for p25 / all by birth year
  cohort: { year: number; rank: number }[];
  population: number; // millions, for context
}

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

// Base rank for p25, all races/sexes — directional, not actual OA values.
const BASE_P25: Record<string, number> = {
  AK: 43, AL: 38, AR: 39, AZ: 42, CA: 44, CO: 47, CT: 45, DC: 39, DE: 42,
  FL: 41, GA: 38, HI: 47, IA: 49, ID: 47, IL: 42, IN: 43, KS: 47, KY: 39,
  LA: 36, MA: 47, MD: 44, ME: 45, MI: 41, MN: 50, MO: 42, MS: 35, MT: 47,
  NC: 40, ND: 51, NE: 49, NH: 49, NJ: 46, NM: 40, NV: 41, NY: 44, OH: 41,
  OK: 41, OR: 44, PA: 43, RI: 44, SC: 38, SD: 49, TN: 39, TX: 42, UT: 49,
  VA: 43, VT: 47, WA: 46, WI: 47, WV: 39, WY: 47,
};

const POP: Record<string, number> = {
  CA: 39, TX: 30, FL: 22, NY: 19.6, PA: 13, IL: 12.5, OH: 11.8, GA: 11,
  NC: 10.7, MI: 10, NJ: 9.3, VA: 8.7, WA: 7.8, AZ: 7.5, TN: 7.1, MA: 7,
  IN: 6.8, MO: 6.2, MD: 6.2, WI: 5.9, CO: 5.8, MN: 5.7, SC: 5.3, AL: 5,
  LA: 4.6, KY: 4.5, OR: 4.2, OK: 4, CT: 3.6, UT: 3.4, IA: 3.2, NV: 3.1,
  AR: 3, MS: 2.9, KS: 2.9, NM: 2.1, NE: 2, ID: 1.9, WV: 1.8, HI: 1.4,
  NH: 1.4, ME: 1.4, MT: 1.1, RI: 1.1, DE: 1, SD: 0.9, ND: 0.8, AK: 0.7,
  VT: 0.6, WY: 0.6, DC: 0.7,
};

function jitter(seed: number, amp: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return ((x - Math.floor(x)) - 0.5) * 2 * amp;
}

function buildRecord(code: string, idx: number): StateRecord {
  const base = BASE_P25[code];
  const mobility = {} as StateRecord["mobility"];
  const incomes: IncomeGroup[] = ["p25", "p50", "p75"];
  const races: Race[] = ["all", "white", "black", "hispanic", "asian"];
  const sexes: Sex[] = ["all", "male", "female"];

  incomes.forEach((inc, ii) => {
    const incomeShift = ii * 8; // children of higher-income parents end up higher
    mobility[inc] = {} as Record<Race, Record<Sex, number>>;
    races.forEach((race, ri) => {
      // Race gaps reflect persistent disparities documented by OA.
      const raceShift =
        race === "all" ? 0 :
        race === "white" ? 4 :
        race === "black" ? -9 :
        race === "hispanic" ? -3 :
        /* asian */ 6;
      mobility[inc][race] = {} as Record<Sex, number>;
      sexes.forEach((sex, si) => {
        const sexShift =
          sex === "all" ? 0 :
          sex === "male" ? (race === "black" ? -4 : -1) :
          /* female */ (race === "black" ? 4 : 1);
        const v = base + incomeShift + raceShift + sexShift + jitter(idx * 31 + ii * 7 + ri * 3 + si, 1.2);
        mobility[inc][race][sex] = Math.max(15, Math.min(80, +v.toFixed(1)));
      });
    });
  });

  // Cohort trend (1978–1992) — slight national decline, with state noise.
  const cohort = Array.from({ length: 8 }, (_, k) => {
    const year = 1978 + k * 2;
    const trend = -0.25 * k + jitter(idx * 11 + k, 0.6);
    return { year, rank: +(base + trend).toFixed(1) };
  });

  return {
    code,
    name: TILE_LAYOUT[code].name,
    mobility,
    cohort,
    population: POP[code] ?? 1,
  };
}

export const STATES: StateRecord[] = Object.keys(TILE_LAYOUT).map((c, i) => buildRecord(c, i));
export const STATES_BY_CODE: Record<string, StateRecord> = Object.fromEntries(
  STATES.map((s) => [s.code, s]),
);

export const NATIONAL_AVG = (income: IncomeGroup, race: Race, sex: Sex) => {
  const total = STATES.reduce((acc, s) => acc + s.mobility[income][race][sex] * s.population, 0);
  const pop = STATES.reduce((acc, s) => acc + s.population, 0);
  return +(total / pop).toFixed(1);
};
