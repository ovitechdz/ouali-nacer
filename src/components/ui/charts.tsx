import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/motion/reduced-motion';

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

export interface ChartPad {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * The product text floor (D-0053). An SVG `<text>` scales with its viewBox, so a
 * CSS size alone cannot guarantee the rendered size: at a 286 px container a
 * 10 px label renders at 4.5 px. The axis labels are therefore sized in viewBox
 * units from the measured width, with the padding scaled by the same factor.
 */
const MIN_TEXT_PX = 12;
const MAX_TEXT_UNITS = 30;
const DEFAULT_TEXT_UNITS = 19;

function textUnitsFor(width: number): number {
  if (!Number.isFinite(width) || width <= 0) return DEFAULT_TEXT_UNITS;
  const units = MIN_TEXT_PX / (width / WIDTH);
  return Math.ceil(Math.min(MAX_TEXT_UNITS, Math.max(MIN_TEXT_PX, units)) * 10) / 10;
}

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
  pad: ChartPad,
  close: boolean,
): string {
  const innerW = WIDTH - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const span = max - min || 1;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const coords = points.map((value, index) => {
    const x = pad.left + index * step;
    const y = pad.top + innerH - ((value - min) / span) * innerH;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const line = `M ${coords.join(' L ')}`;
  if (!close || coords.length === 0) return line;
  const firstX = pad.left;
  const lastX = pad.left + (points.length - 1) * step;
  const baseY = height - pad.bottom;
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
  const figureRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = figureRef.current;
    if (!node) return;
    const measure = () => setWidth(node.getBoundingClientRect().width);
    measure();
    // jsdom (unit tests) has no ResizeObserver; the default unit then applies.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /**
   * Batch 4: the line draws itself the first time the chart reaches the screen.
   * `stroke-dashoffset` and `opacity` only — no layout property, so the axis and
   * the plot box never move. IntersectionObserver starts it instead of
   * ScrollTrigger because a single "in view once" trigger needs neither the
   * plugin nor its weight on this route.
   */
  useEffect(() => {
    const node = figureRef.current;
    if (!node) return;
    const lines = Array.from(node.querySelectorAll<SVGPathElement>('[data-chart-line]'));
    const areas = Array.from(node.querySelectorAll<SVGPathElement>('[data-chart-area]'));
    if (lines.length === 0) return;
    // jsdom has no SVG geometry, so there is no length to draw along.
    if (typeof lines[0]?.getTotalLength !== 'function') return;
    if (prefersReducedMotion()) return;

    // Hide the finished line from the first paint: a draw starts from a full
    // dash offset, and a line that appears then jumps back to zero glitches.
    for (const line of lines) line.style.opacity = '0';

    const restore = (): void => {
      for (const line of lines) {
        line.style.removeProperty('opacity');
        line.style.removeProperty('stroke-dasharray');
        line.style.removeProperty('stroke-dashoffset');
      }
      for (const area of areas) area.style.removeProperty('opacity');
    };

    let cancelled = false;
    let revert: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;

    const draw = (): void => {
      void import('gsap')
        .then(({ gsap }) => {
          if (cancelled) {
            // The cleanup already restored the chart, or the next effect run
            // owns it (React StrictMode); do not wipe the newer hidden state.
            return;
          }
          const context = gsap.context(() => {
            lines.forEach((line, index) => {
              const length = line.getTotalLength();
              gsap.set(line, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 });
              gsap.to(line, {
                strokeDashoffset: 0,
                duration: 0.6,
                ease: 'power2.out',
                delay: index * 0.12,
                clearProps: 'strokeDasharray,strokeDashoffset,opacity',
              });
            });
            areas.forEach((area, index) => {
              // The class carries the resting opacity (`opacity-15`); read it so
              // the fade lands exactly on the design value instead of 1.
              const resting = Number.parseFloat(getComputedStyle(area).opacity) || 0;
              gsap.fromTo(
                area,
                { opacity: 0 },
                {
                  opacity: resting,
                  duration: 0.4,
                  ease: 'power2.out',
                  delay: 0.25 + index * 0.12,
                  clearProps: 'opacity',
                },
              );
            });
          }, node);
          revert = () => context.revert();
        })
        .catch(() => {
          // A failed chunk load must leave the finished chart on screen.
          restore();
        });
    };

    if (typeof IntersectionObserver === 'undefined') {
      // jsdom: draw at once rather than never.
      draw();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          observer = undefined;
          draw();
        },
        { rootMargin: '0px 0px -8% 0px' },
      );
      observer.observe(node);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      revert?.();
      restore();
    };
  }, []);

  const unit = textUnitsFor(width);
  const { min, max } = build(series.map((entry) => entry.points));
  const ticks = [0, 0.5, 1].map((ratio) => {
    const value = min + (max - min) * ratio;
    return { ratio, label: String(yFormat ? yFormat(value) : Math.round(value)) };
  });
  const widest = ticks.reduce((longest, tick) => Math.max(longest, tick.label.length), 1);
  const pad: ChartPad = {
    top: Math.round(unit * 0.85),
    right: 12,
    bottom: Math.round(unit * 1.15),
    left: Math.round(widest * unit * 0.62 + unit * 0.7),
  };
  const innerH = height - pad.top - pad.bottom;
  const plotted = ticks.map((tick) => ({
    ...tick,
    y: pad.top + innerH - tick.ratio * innerH,
  }));

  return (
    <figure ref={figureRef} className={cn('min-w-0', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={summary}
        className="h-auto w-full"
      >
        {plotted.map((tick) => (
          <g key={tick.ratio}>
            <line
              x1={pad.left}
              x2={WIDTH - pad.right}
              y1={tick.y}
              y2={tick.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            />
            <text
              x={pad.left - unit * 0.7}
              y={tick.y + unit * 0.35}
              fontSize={unit}
              textAnchor="end"
              className="fill-fg-subtle"
            >
              {tick.label}
            </text>
          </g>
        ))}
        {series.map((entry) => (
          <path
            key={`${entry.id}-area`}
            data-chart-area=""
            d={pathFor(entry.points, min, max, height, pad, true)}
            fill="currentColor"
            className={cn('opacity-15', entry.tone)}
            aria-hidden="true"
          />
        ))}
        {series.map((entry) => (
          <path
            key={entry.id}
            data-chart-line=""
            d={pathFor(entry.points, min, max, height, pad, false)}
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
        // The plot is not mirrored for RTL, so the labels must run in the same
        // direction as the line; otherwise an Arabic reader reads the trend
        // backwards.
        <div dir="ltr" className="mt-1 flex justify-between gap-1 text-xs text-fg-subtle">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      ) : null}
      <figcaption className="mt-2 flex flex-wrap gap-3 text-xs text-fg-muted">
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
