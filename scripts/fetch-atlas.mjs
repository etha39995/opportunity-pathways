#!/usr/bin/env node
/**
 * fetch-atlas.mjs
 *
 * Downloads the Opportunity Insights tract-level outcomes file
 * (tract_outcomes_simple.csv, ~33MB) and aggregates it to state level
 * using population-weighted averages of the household-income-rank
 * outcome (kfr_<race>_<sex>_p25 — kid family rank, parents at p25).
 *
 * Source:
 *   https://opportunityinsights.org/data/
 *   File: https://opportunityinsights.org/wp-content/uploads/2018/10/tract_outcomes_simple.csv
 *
 * Codebook (relevant columns):
 *   state, county, tract              — FIPS components
 *   pooled_pooled_count               — sample size, all races/sex
 *   <race>_<sex>_count                — sample size for subgroup
 *   kfr_<race>_<sex>_p25              — mean income rank at age ~30 for
 *                                       children whose parents were at the
 *                                       25th percentile of the national
 *                                       income distribution (0–100 scale).
 *   race ∈ {pooled, white, black, hisp}; sex ∈ {pooled, female, male}.
 *
 * Output: src/data/mobility.real.json — one record per state in
 * StateRecord shape. Only p25 is available in this extract; p50/p75 and
 * Asian-only series come from larger OI files (tract_outcomes.zip, 2.6GB)
 * and are intentionally omitted here.
 *
 * Citation: Chetty, Friedman, Hendren, Jones, Porter (2018), "The
 * Opportunity Atlas: Mapping the Childhood Roots of Social Mobility,"
 * NBER Working Paper 25147. Data © Opportunity Insights.
 */

import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "data", "raw");
const OUT_FILE = path.join(ROOT, "src", "data", "mobility.real.json");
const SRC_URL =
  "https://opportunityinsights.org/wp-content/uploads/2018/10/tract_outcomes_simple.csv";
const RAW_FILE = path.join(RAW_DIR, "tract_outcomes_simple.csv");

// FIPS state code (2-digit) → USPS code + name. Matches TILE_LAYOUT in
// src/data/mobility.ts. We skip territories not in the tile cartogram.
const FIPS_TO_STATE = {
  "01": ["AL", "Alabama"], "02": ["AK", "Alaska"], "04": ["AZ", "Arizona"],
  "05": ["AR", "Arkansas"], "06": ["CA", "California"], "08": ["CO", "Colorado"],
  "09": ["CT", "Connecticut"], "10": ["DE", "Delaware"], "11": ["DC", "District of Columbia"],
  "12": ["FL", "Florida"], "13": ["GA", "Georgia"], "15": ["HI", "Hawaii"],
  "16": ["ID", "Idaho"], "17": ["IL", "Illinois"], "18": ["IN", "Indiana"],
  "19": ["IA", "Iowa"], "20": ["KS", "Kansas"], "21": ["KY", "Kentucky"],
  "22": ["LA", "Louisiana"], "23": ["ME", "Maine"], "24": ["MD", "Maryland"],
  "25": ["MA", "Massachusetts"], "26": ["MI", "Michigan"], "27": ["MN", "Minnesota"],
  "28": ["MS", "Mississippi"], "29": ["MO", "Missouri"], "30": ["MT", "Montana"],
  "31": ["NE", "Nebraska"], "32": ["NV", "Nevada"], "33": ["NH", "New Hampshire"],
  "34": ["NJ", "New Jersey"], "35": ["NM", "New Mexico"], "36": ["NY", "New York"],
  "37": ["NC", "North Carolina"], "38": ["ND", "North Dakota"], "39": ["OH", "Ohio"],
  "40": ["OK", "Oklahoma"], "41": ["OR", "Oregon"], "42": ["PA", "Pennsylvania"],
  "44": ["RI", "Rhode Island"], "45": ["SC", "South Carolina"], "46": ["SD", "South Dakota"],
  "47": ["TN", "Tennessee"], "48": ["TX", "Texas"], "49": ["UT", "Utah"],
  "50": ["VT", "Vermont"], "51": ["VA", "Virginia"], "53": ["WA", "Washington"],
  "54": ["WV", "West Virginia"], "55": ["WI", "Wisconsin"], "56": ["WY", "Wyoming"],
};

// 2020 Census state populations, in millions. Used only for context cards
// in the UI; aggregation weights come from the Atlas sample counts.
const POP_M = {
  CA: 39.5, TX: 29.1, FL: 21.5, NY: 20.2, PA: 13.0, IL: 12.8, OH: 11.8,
  GA: 10.7, NC: 10.4, MI: 10.1, NJ: 9.3, VA: 8.6, WA: 7.7, AZ: 7.2,
  TN: 6.9, MA: 7.0, IN: 6.8, MO: 6.2, MD: 6.2, WI: 5.9, CO: 5.8, MN: 5.7,
  SC: 5.1, AL: 5.0, LA: 4.7, KY: 4.5, OR: 4.2, OK: 4.0, CT: 3.6, UT: 3.3,
  IA: 3.2, NV: 3.1, AR: 3.0, MS: 2.9, KS: 2.9, NM: 2.1, NE: 2.0, ID: 1.8,
  WV: 1.8, HI: 1.5, NH: 1.4, ME: 1.4, MT: 1.1, RI: 1.1, DE: 1.0, SD: 0.9,
  ND: 0.8, AK: 0.7, VT: 0.6, WY: 0.6, DC: 0.7,
};

// Map Atlas race/sex tokens → app keys.
const RACES = [
  ["pooled", "all"], ["white", "white"], ["black", "black"], ["hisp", "hispanic"],
];
const SEXES = [
  ["pooled", "all"], ["male", "male"], ["female", "female"],
];

async function ensureRaw() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  if (fs.existsSync(RAW_FILE) && fs.statSync(RAW_FILE).size > 1_000_000) {
    console.log(`[fetch-atlas] using cached ${RAW_FILE}`);
    return;
  }
  console.log(`[fetch-atlas] downloading ${SRC_URL} …`);
  const res = await fetch(SRC_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (lovable atlas-fetch)" },
  });
  if (!res.ok || !res.body) {
    throw new Error(`download failed: HTTP ${res.status}`);
  }
  await pipeline(res.body, fs.createWriteStream(RAW_FILE));
  console.log(`[fetch-atlas] wrote ${RAW_FILE} (${(fs.statSync(RAW_FILE).size / 1e6).toFixed(1)} MB)`);
}

function parseCSV(file) {
  // The file is well-formed RFC 4180 with no embedded commas/newlines in
  // numeric outcome columns, so a streaming line split is sufficient.
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const header = lines[0].split(",");
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    rows.push(line.split(","));
  }
  return { idx, rows };
}

function aggregate({ idx, rows }) {
  // accum[stateUSPS][race][sex] = { num, den }
  const accum = {};
  for (const [, [usps]] of Object.entries(FIPS_TO_STATE)) {
    accum[usps] = {};
    for (const [, rk] of RACES) {
      accum[usps][rk] = {};
      for (const [, sk] of SEXES) accum[usps][rk][sk] = { num: 0, den: 0 };
    }
  }

  const stateIdx = idx["state"];
  for (const row of rows) {
    const fips = String(row[stateIdx]).padStart(2, "0");
    const meta = FIPS_TO_STATE[fips];
    if (!meta) continue; // skip PR/territories
    const usps = meta[0];
    for (const [r, rk] of RACES) {
      for (const [s, sk] of SEXES) {
        const valCol = `kfr_${r}_${s}_p25`;
        const cntCol = `${r}_${s}_count`;
        const vRaw = row[idx[valCol]];
        const cRaw = row[idx[cntCol]];
        if (!vRaw || !cRaw || vRaw === "NA" || cRaw === "NA") continue;
        const v = Number(vRaw);
        const c = Number(cRaw);
        if (!Number.isFinite(v) || !Number.isFinite(c) || c <= 0) continue;
        // The kfr columns are reported as fractions (0–1) in this file —
        // multiply by 100 to get a 0–100 income rank like the rest of the app.
        const rank = v * 100;
        accum[usps][rk][sk].num += rank * c;
        accum[usps][rk][sk].den += c;
      }
    }
  }

  const out = [];
  for (const [, [usps, name]] of Object.entries(FIPS_TO_STATE)) {
    const mobility = { p25: {} };
    let anyData = false;
    for (const [, rk] of RACES) {
      mobility.p25[rk] = {};
      for (const [, sk] of SEXES) {
        const { num, den } = accum[usps][rk][sk];
        const v = den > 0 ? +(num / den).toFixed(1) : null;
        if (v !== null) anyData = true;
        mobility.p25[rk][sk] = v;
      }
    }
    if (!anyData) {
      console.warn(`[fetch-atlas] no data for ${usps}; skipping`);
      continue;
    }
    out.push({
      code: usps,
      name,
      mobility, // only p25 populated; UI hides p50/p75
      cohort: [], // tract_outcomes_simple has no cohort breakdown
      population: POP_M[usps] ?? 1,
    });
  }
  return out;
}

async function main() {
  await ensureRaw();
  console.log("[fetch-atlas] parsing CSV …");
  const parsed = parseCSV(RAW_FILE);
  console.log(`[fetch-atlas] ${parsed.rows.length} tract rows`);
  const states = aggregate(parsed);
  console.log(`[fetch-atlas] aggregated to ${states.length} states`);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        source: SRC_URL,
        generatedAt: new Date().toISOString(),
        notes:
          "Population-weighted state aggregates of tract-level kfr_*_p25 from " +
          "Opportunity Insights tract_outcomes_simple.csv. Only p25 parental " +
          "income is available; race=Asian and multi-cohort trends are not " +
          "included in this extract.",
        states,
      },
      null,
      2,
    ),
  );
  console.log(`[fetch-atlas] wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
