import {
  Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  STATES_BY_CODE, NATIONAL_AVG, valueFor,
  type IncomeGroup, type Race, type Sex,
} from "@/data/mobility";

interface Props {
  code: string;
  income: IncomeGroup;
  race: Race;
  sex: Sex;
}

const RACES: { key: Race; label: string }[] = [
  { key: "white", label: "White" },
  { key: "black", label: "Black" },
  { key: "hispanic", label: "Hispanic" },
];

export function DetailPanel({ code, income, race, sex }: Props) {
  const s = STATES_BY_CODE[code];
  if (!s) return null;
  const value = valueFor(s, income, race, sex);
  const national = NATIONAL_AVG(income, race, sex);
  const delta = value == null ? null : +(value - national).toFixed(1);

  const raceData = RACES
    .map((r) => {
      const sv = valueFor(s, income, r.key, sex);
      const nv = NATIONAL_AVG(income, r.key, sex);
      return sv == null ? null : { group: r.label, state: sv, national: nv };
    })
    .filter((d): d is { group: string; state: number; national: number } => d !== null);

  // Sex gap for the active race — Atlas data shows this is the most policy-relevant
  // breakdown after race, especially for Black men vs Black women.
  const sexData: { group: string; value: number }[] = [];
  for (const sk of ["female", "male"] as const) {
    const sv = valueFor(s, income, race, sk);
    if (sv != null) sexData.push({ group: sk === "female" ? "Women" : "Men", value: sv });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Selected place</div>
        <h3 className="mt-1 font-display text-3xl text-ink">{s.name}</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Population ~{s.population.toFixed(1)}M · Children born ~1978–1983
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Adult income rank"
          value={value == null ? "—" : value.toFixed(1)}
          suffix={value == null ? undefined : "/100"}
        />
        <Stat
          label="Vs. national"
          value={delta == null ? "—" : (delta >= 0 ? "+" : "") + delta}
          tone={delta == null ? undefined : delta >= 0 ? "up" : "down"}
        />
        <Stat label="National avg" value={national.toFixed(1)} suffix="/100" muted />
      </div>

      {raceData.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-ink">By race · same filters</h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={raceData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="group" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis domain={[20, 70]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="state" name={s.code} fill="var(--color-scale-6)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="national" name="US avg" fill="var(--color-scale-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sexData.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-ink">
            Women vs. men <span className="font-normal text-muted-foreground">
              ({race === "all" ? "all races" : race})
            </span>
          </h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sexData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" domain={[20, 70]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis type="category" dataKey="group" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} width={56} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--color-scale-5)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Source: Opportunity Insights tract-level outcomes, aggregated to states by
        population-weighted average. Cohort and race=Asian breakdowns are not
        included in the public extract used here.
      </p>
    </div>
  );
}

function Stat({
  label, value, suffix, tone, muted,
}: { label: string; value: string; suffix?: string; tone?: "up" | "down"; muted?: boolean }) {
  const toneClass = tone === "up" ? "text-[var(--color-scale-6)]" : tone === "down" ? "text-[var(--color-scale-1)]" : "text-ink";
  return (
    <div className={`rounded-lg border bg-card p-3 ${muted ? "opacity-80" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl tabular-nums ${toneClass}`}>
        {value}
        {suffix && <span className="ml-0.5 text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
