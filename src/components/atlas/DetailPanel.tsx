import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { STATES_BY_CODE, NATIONAL_AVG, type IncomeGroup, type Race, type Sex } from "@/data/mobility";

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
  { key: "asian", label: "Asian" },
];

export function DetailPanel({ code, income, race, sex }: Props) {
  const s = STATES_BY_CODE[code];
  const value = s.mobility[income][race][sex];
  const national = NATIONAL_AVG(income, race, sex);
  const delta = +(value - national).toFixed(1);

  const raceData = RACES.map((r) => ({
    group: r.label,
    state: s.mobility[income][r.key][sex],
    national: NATIONAL_AVG(income, r.key, sex),
  }));

  const cohortData = s.cohort.map((c) => ({
    year: c.year,
    state: c.rank,
    national: NATIONAL_AVG("p25", "all", "all") - 0.25 * ((c.year - 1978) / 2),
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Selected place</div>
        <h3 className="mt-1 font-display text-3xl text-ink">{s.name}</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Population ~{s.population.toFixed(1)}M · Cohort born 1978–1992
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Adult income rank" value={value.toFixed(1)} suffix="/100" />
        <Stat
          label="Vs. national"
          value={(delta >= 0 ? "+" : "") + delta}
          tone={delta >= 0 ? "up" : "down"}
        />
        <Stat label="National avg" value={national.toFixed(1)} suffix="/100" muted />
      </div>

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

      <div>
        <h4 className="mb-2 text-sm font-semibold text-ink">
          Trend across birth cohorts <span className="font-normal text-muted-foreground">(p25 parents)</span>
        </h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cohortData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis domain={[30, 55]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine y={50} stroke="var(--color-border)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="state" name={s.code} stroke="var(--color-scale-6)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="national" name="US avg" stroke="var(--color-scale-1)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
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
