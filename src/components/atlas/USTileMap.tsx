import { useMemo, useState } from "react";
import { STATES, TILE_LAYOUT, valueFor, type Race, type Sex, type IncomeGroup } from "@/data/mobility";

interface Props {
  income: IncomeGroup;
  race: Race;
  sex: Sex;
  selected: string;
  onSelect: (code: string) => void;
}

const SCALE_VARS = ["--scale-1", "--scale-2", "--scale-3", "--scale-4", "--scale-5", "--scale-6"];

function bucket(value: number, min: number, max: number) {
  const t = (value - min) / (max - min);
  const i = Math.min(SCALE_VARS.length - 1, Math.max(0, Math.floor(t * SCALE_VARS.length)));
  return `var(${SCALE_VARS[i]})`;
}

export function USTileMap({ income, race, sex, selected, onSelect }: Props) {
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);

  const values = useMemo(() => {
    const map = new Map<string, number | null>();
    STATES.forEach((s) => map.set(s.code, valueFor(s, income, race, sex)));
    return map;
  }, [income, race, sex]);

  const [min, max] = useMemo(() => {
    const arr = [...values.values()].filter((v): v is number => v != null);
    return arr.length ? [Math.min(...arr), Math.max(...arr)] : [0, 1];
  }, [values]);

  const cell = 56;
  const gap = 6;
  const cols = 12;
  const rows = 7;
  const width = cols * (cell + gap);
  const height = rows * (cell + gap);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="US tile cartogram of upward mobility"
      >
        {Object.entries(TILE_LAYOUT).map(([code, pos]) => {
          const v = values.get(code) ?? 0;
          const isSel = selected === code;
          const x = pos.col * (cell + gap);
          const y = pos.row * (cell + gap);
          return (
            <g
              key={code}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({ code, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseMove={(e) => {
                const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({ code, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(code)}
            >
              <rect
                width={cell}
                height={cell}
                rx={8}
                fill={bucket(v, min, max)}
                stroke={isSel ? "var(--color-ink)" : "transparent"}
                strokeWidth={isSel ? 3 : 0}
                style={{ transition: "stroke 120ms ease, transform 120ms ease" }}
              />
              <text
                x={cell / 2}
                y={cell / 2 - 4}
                textAnchor="middle"
                className="fill-white"
                style={{ fontSize: 13, fontWeight: 600, pointerEvents: "none" }}
              >
                {code}
              </text>
              <text
                x={cell / 2}
                y={cell / 2 + 14}
                textAnchor="middle"
                className="fill-white/85"
                style={{ fontSize: 11, pointerEvents: "none" }}
              >
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-semibold text-popover-foreground">
            {TILE_LAYOUT[hover.code].name}
          </div>
          <div className="text-muted-foreground">
            Adult income rank: <span className="font-medium text-foreground">
              {(values.get(hover.code) ?? 0).toFixed(1)}
            </span>
          </div>
          <div className="text-muted-foreground">Click to inspect</div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span>Lower mobility</span>
        <div className="flex h-2 flex-1 max-w-xs overflow-hidden rounded-full">
          {SCALE_VARS.map((v) => (
            <div key={v} className="flex-1" style={{ background: `var(${v})` }} />
          ))}
        </div>
        <span>Higher mobility</span>
        <span className="ml-2 tabular-nums">
          {min.toFixed(0)}–{max.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
