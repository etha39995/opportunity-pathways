import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { USTileMap } from "@/components/atlas/USTileMap";
import { Filters } from "@/components/atlas/Filters";
import { DetailPanel } from "@/components/atlas/DetailPanel";
import {
  STATES, NATIONAL_AVG, type IncomeGroup, type Race, type Sex,
} from "@/data/mobility";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "The Geography of Opportunity — Where Low-Income Kids Move Up" },
      {
        name: "description",
        content:
          "An interactive look at upward mobility across U.S. states using Opportunity Atlas–style data — by parental income, race, and sex.",
      },
    ],
  }),
});

function Index() {
  const [income, setIncome] = useState<IncomeGroup>("p25");
  const [race, setRace] = useState<Race>("all");
  const [sex, setSex] = useState<Sex>("all");
  const [selected, setSelected] = useState<string>("NC");

  const ranked = useMemo(
    () => [...STATES].sort((a, b) => b.mobility[income][race][sex] - a.mobility[income][race][sex]),
    [income, race, sex],
  );
  const top = ranked.slice(0, 3);
  const bottom = ranked.slice(-3).reverse();
  const national = NATIONAL_AVG(income, race, sex);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="border-b bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-scale-6)]" />
            Opportunity Atlas · interactive
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            Where do children from low-income families <em className="not-italic text-[var(--color-scale-6)]">move up</em>?
          </h1>
          <p className="mt-5 max-w-2xl text-base text-ink-soft md:text-lg">
            The neighborhood a child grows up in shapes how much they earn as an adult. Explore
            how upward mobility differs across U.S. states by parental income, race, and sex —
            and how those patterns have shifted across birth cohorts.
          </p>
        </div>
      </header>

      {/* Why this matters */}
      <section className="border-b bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3">
          <Why
            kicker="The metric"
            title="Adult income rank"
            body="The average national income percentile (0–100) reached by age 35 by children raised in the selected place, parental income group, race, and sex."
          />
          <Why
            kicker="Why it matters"
            title="Place is policy"
            body="Children from identical family backgrounds end up with very different incomes depending on where they grow up. That makes mobility a question of housing, schools, and labor markets — all things policy can change."
          />
          <Why
            kicker="What to look for"
            title="Patterns, not points"
            body="A single number is a starting point. Compare across regions, race groups, and birth cohorts to see how durable advantages — and disadvantages — really are."
          />
        </div>
      </section>

      {/* Map + filters + detail */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr_360px]">
            {/* Filters */}
            <aside className="rounded-xl border bg-card p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
              <Filters
                income={income} setIncome={setIncome}
                race={race} setRace={setRace}
                sex={sex} setSex={setSex}
              />
              <div className="mt-6 rounded-lg bg-secondary p-3 text-xs text-ink-soft">
                <div className="font-semibold text-ink">National average</div>
                <div className="mt-1 font-display text-2xl text-ink tabular-nums">{national.toFixed(1)}<span className="text-sm text-muted-foreground">/100</span></div>
                <div className="mt-1">Population-weighted, current filters.</div>
              </div>
            </aside>

            {/* Map */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-xl text-ink">U.S. tile cartogram</h2>
                <div className="text-xs text-muted-foreground">Each tile = one state. Click to inspect.</div>
              </div>
              <USTileMap
                income={income} race={race} sex={sex}
                selected={selected} onSelect={setSelected}
              />

              <div className="mt-6 grid gap-4 border-t pt-5 md:grid-cols-2">
                <RankList title="Highest mobility" items={top} income={income} race={race} sex={sex} accent="var(--color-scale-6)" />
                <RankList title="Lowest mobility" items={bottom} income={income} race={race} sex={sex} accent="var(--color-scale-1)" />
              </div>
            </div>

            {/* Detail */}
            <aside className="rounded-xl border bg-card p-5 shadow-sm">
              <DetailPanel code={selected} income={income} race={race} sex={sex} />
            </aside>
          </div>

          {/* Annotation */}
          <div className="mt-10 grid gap-4 rounded-xl border-l-4 border-[var(--color-scale-6)] bg-card p-6 shadow-sm md:grid-cols-[auto_1fr] md:items-center">
            <div className="font-display text-3xl text-ink">A persistent regional gap.</div>
            <p className="text-sm text-ink-soft md:text-base">
              For children of low-income parents, states across the Plains and Upper Midwest consistently
              produce higher adult incomes than much of the Southeast. Race and sex filters reveal that this
              geography is not the same for every group — Black men, in particular, face systematically lower
              mobility almost everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-muted-foreground md:flex md:items-center md:justify-between">
          <div>
            Concept and visualization inspired by the{" "}
            <a className="underline hover:text-foreground" href="https://www.opportunityatlas.org" target="_blank" rel="noreferrer">
              Opportunity Atlas
            </a>{" "}
            (Chetty, Friedman, Hendren, Jones, Porter). Values shown here are illustrative —
            wire to the official extracts for production use.
          </div>
          <div className="mt-3 md:mt-0">© {new Date().getFullYear()} · Built for civic exploration</div>
        </div>
      </footer>
    </main>
  );
}

function Why({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-scale-6)]">{kicker}</div>
      <div className="mt-1 font-display text-xl text-ink">{title}</div>
      <p className="mt-2 text-sm text-ink-soft">{body}</p>
    </div>
  );
}

function RankList({
  title, items, income, race, sex, accent,
}: {
  title: string;
  items: typeof STATES;
  income: IncomeGroup; race: Race; sex: Sex;
  accent: string;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="space-y-1.5">
        {items.map((s) => (
          <li key={s.code} className="flex items-center gap-3 text-sm">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent }} />
            <span className="flex-1 text-ink">{s.name}</span>
            <span className="font-display tabular-nums text-ink">
              {s.mobility[income][race][sex].toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
