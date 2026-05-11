import type { IncomeGroup, Race, Sex } from "@/data/mobility";

interface Props {
  income: IncomeGroup; setIncome: (v: IncomeGroup) => void;
  race: Race; setRace: (v: Race) => void;
  sex: Sex; setSex: (v: Sex) => void;
}

const INCOME: { key: IncomeGroup; label: string; sub: string }[] = [
  { key: "p25", label: "Low-income", sub: "25th pct parents" },
  { key: "p50", label: "Middle", sub: "50th pct parents" },
  { key: "p75", label: "High-income", sub: "75th pct parents" },
];
const RACE: { key: Race; label: string }[] = [
  { key: "all", label: "All" },
  { key: "white", label: "White" },
  { key: "black", label: "Black" },
  { key: "hispanic", label: "Hispanic" },
  { key: "asian", label: "Asian" },
];
const SEX: { key: Sex; label: string }[] = [
  { key: "all", label: "All" },
  { key: "female", label: "Women" },
  { key: "male", label: "Men" },
];

export function Filters({ income, setIncome, race, setRace, sex, setSex }: Props) {
  return (
    <div className="grid gap-5">
      <Group label="Parental income">
        <div className="grid grid-cols-3 gap-2">
          {INCOME.map((o) => (
            <button
              key={o.key}
              onClick={() => setIncome(o.key)}
              className={`rounded-md border px-3 py-2 text-left transition ${
                income === o.key
                  ? "border-ink bg-ink text-background"
                  : "border-border bg-card hover:border-ink/30"
              }`}
            >
              <div className="text-sm font-semibold">{o.label}</div>
              <div className={`text-[11px] ${income === o.key ? "opacity-75" : "text-muted-foreground"}`}>{o.sub}</div>
            </button>
          ))}
        </div>
      </Group>

      <Group label="Race / ethnicity">
        <Pills options={RACE} value={race} onChange={setRace} />
      </Group>

      <Group label="Sex">
        <Pills options={SEX} value={sex} onChange={setSex} />
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Pills<T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            value === o.key
              ? "border-ink bg-ink text-background"
              : "border-border bg-card text-foreground hover:border-ink/30"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
