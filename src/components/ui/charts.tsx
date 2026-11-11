import { cn } from '@/lib/cn';

export interface ChartSeries {
  id: string;
  label: string;
  points: number[];
  /** Tailwind text colour class; the stroke uses currentColor. */
  tone: string;
  area?: boolean;
}

export interface ChartProps {
  series: ChartSeries[];
  labels?: string[];
  height?: number;
  summary: string;
  className?: string;
  yFormat?: (value: number) => string;
}

const WIDTH = 640;
const PAD = { top: 16, right: 12, bottom: 24, left: 40 };

function build(values: number[][]): { min: number; max: number } {
  const flat = values.flat().filter((value) => Number.isFinite(value));
  if (flat.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return { min: min - pad, max: max + pad };
  }
  return { min, max };
}

function pathFor(
  points: number[],
  min: number,
  max: number,
  height: number,
  close: boolean,
): string {
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const span = max - min || 1;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const coords = points.map((value, index) => {
    const x = PAD.left + index * step;
    const y = PAD.top + innerH - ((value - min) / span) * innerH;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const line = `M ${coords.join(' L ')}`;
  if (!close || coords.length === 0) return line;
  const firstX = PAD.left;
  const lastX = PAD.left + (points.length - 1) * step;
  const baseY = height - PAD.bottom;
  return `${line} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;
}

export function LineChart({
  series,
  labels,
  height = 200,
  summary,
  className,
  yFormat,
}: ChartProps) {
  const { min, max } = build(series.map((entry) => entry.points));
  const innerH = height - PAD.top - PAD.bottom;
  const ticks = [0, 0.5, 1].map((ratio) => {
    const value = min + (max - min) * ratio;
    return { value, y: PAD.top + innerH - ratio * innerH };
  });

  return (
    <figure className={cn('min-w-0', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={summary}
        className="h-auto w-full"
      >
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            />
            <text x={4} y={tick.y + 4} className="fill-fg-subtle text-[10px]">
              {yFormat ? yFormat(tick.value) : Math.round(tick.value)}
            </text>
          </g>
        ))}
        {series.map((entry) => (
          <path
            key={`${entry.id}-area`}
            d={pathFor(entry.points, min, max, height, true)}
            fill="currentColor"
            className={cn('opacity-15', entry.tone)}
            aria-hidden="true"
          />
        ))}
        {series.map((entry) => (
          <path
            key={entry.id}
            d={pathFor(entry.points, min, max, height, false)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className={entry.tone}
          />
        ))}
      </svg>
      {labels && labels.length > 0 ? (
        <div className="mt-1 flex justify-between gap-1 text-[10px] text-fg-subtle">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      ) : null}
      <figcaption className="mt-2 flex flex-wrap gap-3 text-[11px] text-fg-muted">
        {series.map((entry) => (
          <span key={entry.id} className="inline-flex items-center gap-1.5">
            <span
              className={cn('inline-block size-2 rounded-full bg-current', entry.tone)}
              aria-hidden="true"
            />
            {entry.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function Sparkline({
  points,
  tone = 'text-accent',
  summary,
}: {
  points: number[];
  tone?: string;
  summary: string;
}) {
  if (points.length < 2) return <span className="text-xs text-fg-subtle">—</span>;
  const { min, max } = build([points]);
  const span = max - min || 1;
  const step = 120 / (points.length - 1);
  const d = points
    .map((value, index) => {
      const x = index * step;
      const y = 30 - ((value - min) / span) * 26;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' L ');
  return (
    <svg viewBox="0 0 120 32" role="img" aria-label={summary} className="h-8 w-28">
      <path
        d={`M ${d}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={tone}
      />
    </svg>
  );
}
