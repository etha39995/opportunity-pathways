# Geography of Opportunity

Interactive state-level visualization of upward mobility built on
[Opportunity Insights](https://opportunityinsights.org/data/) tract-level
outcomes data.

## Data pipeline

The site renders real Atlas-derived values, not mocked numbers. The build
flow is:

1. `npm run fetch-atlas`
   - Downloads `tract_outcomes_simple.csv` (~33 MB) from
     `https://opportunityinsights.org/wp-content/uploads/2018/10/tract_outcomes_simple.csv`
     into `data/raw/` (gitignored, cached between runs).
   - Aggregates the ~73k tract rows to 51 state-level records by
     **population-weighted average** of the `kfr_<race>_<sex>_p25` columns
     (kid-family-rank for parents at the 25th income percentile), using the
     Atlas `<race>_<sex>_count` sample sizes as weights.
   - Writes `src/data/mobility.real.json`.
2. `npm run build` (or `dev`)
   - `src/data/mobility.ts` statically imports `mobility.real.json` and
     exposes the existing `STATES`, `STATES_BY_CODE`, and `NATIONAL_AVG`
     APIs unchanged. If the JSON is missing the build fails loudly.

### Available filter cells

The public `tract_outcomes_simple` extract carries a subset of the full
Atlas. The UI greys out anything the data does not support:

| Dimension | Available | Not available |
|---|---|---|
| Parental income | p25 | p50, p75 (in `tract_outcomes.zip`, 2.6 GB) |
| Race | All, White, Black, Hispanic | Asian |
| Sex | All, Female, Male | — |
| Cohort trend | — | Single pooled cohort only in this file |

To unlock additional cells, swap the source URL in `scripts/fetch-atlas.mjs`
to the larger `tract_outcomes.zip` (or one of the cohort-stratified files
on the OI data page) and extend the `RACES` / income loops.

## Citation & licensing

Chetty, R., Friedman, J. N., Hendren, N., Jones, M. R., & Porter, S. R.
(2018). *The Opportunity Atlas: Mapping the Childhood Roots of Social
Mobility.* NBER Working Paper 25147.

Data © Opportunity Insights, distributed publicly at
<https://opportunityinsights.org/data/>. Please cite the paper above when
reusing.

## Development

```bash
npm install
npm run fetch-atlas   # one-time, regenerate when OI publishes new vintage
npm run dev
```
