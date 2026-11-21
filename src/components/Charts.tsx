import React, { useMemo, useState } from 'react';
import {
  fmt,
  formatTick,
  mean,
  niceTicks,
  poissonPmf,
  probit,
  stepTicks,
  variance,
} from '../lib/statistics';

interface SlotSequenceChartProps {
  data: number[];
  lambda: number;
  slotMin: number;
  bandLow?: number;
  bandHigh?: number;
}

export const SlotSequenceChart: React.FC<SlotSequenceChartProps> = ({
  data,
  lambda,
  slotMin,
  bandLow,
  bandHigh,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 720;
  const H = 175;
  const m = { l: 42, r: 14, t: 16, b: 28 };

  const maxVal = Math.max(...data, lambda, 1);
  const yTicks = niceTicks(maxVal * 1.1, 3);
  const yMax = yTicks[yTicks.length - 1];
  const n = data.length;

  const sx = (i: number) => m.l + (n > 1 ? (i / (n - 1)) * (W - m.l - m.r) : (W - m.l - m.r) / 2);
  const sy = (v: number) => H - m.b - (v / yMax) * (H - m.t - m.b);

  const pathPoints = useMemo(
    () => data.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' '),
    [data, yMax]
  );

  const xTicks = stepTicks(1, n, 8);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-[var(--accent-primary)]" />
            Observed slot count
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t border-dashed border-[var(--accent-expected)]" />
            Mean rate (λ = {fmt(lambda, 2)})
          </span>
        </div>
        <div className="font-mono-tabular text-[var(--ink-primary)]">
          {hoverIdx !== null ? (
            <span>
              Slot #{hoverIdx + 1}: <strong>{data[hoverIdx]}</strong> vehicles
            </span>
          ) : (
            <span className="text-[var(--ink-muted)]">
              Hover sequence to inspect slot-by-slot inflow ({slotMin}-min slots)
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full select-none"
        role="img"
        aria-label="Slot-by-slot vehicle count sequence"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {bandLow !== undefined && bandHigh !== undefined && bandLow < bandHigh && (
          <rect
            x={m.l}
            y={sy(Math.min(bandHigh, yMax))}
            width={W - m.l - m.r}
            height={Math.max(0, sy(bandLow) - sy(Math.min(bandHigh, yMax)))}
            fill="var(--bg-subtle)"
            opacity="0.7"
          />
        )}

        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={m.l}
              x2={W - m.r}
              y1={sy(t)}
              y2={sy(t)}
              stroke="var(--rule-hairline)"
              strokeWidth={1}
            />
            <text
              x={m.l - 6}
              y={sy(t) + 3.5}
              textAnchor="end"
              fill="var(--ink-muted)"
              fontSize="10.5"
              className="font-mono-tabular"
            >
              {formatTick(t)}
            </text>
          </g>
        ))}

        {xTicks.map((t) => (
          <text
            key={t}
            x={sx(t - 1)}
            y={H - 8}
            textAnchor="middle"
            fill="var(--ink-muted)"
            fontSize="10.5"
            className="font-mono-tabular"
          >
            {t}
          </text>
        ))}

        <line
          x1={m.l}
          x2={W - m.r}
          y1={sy(0)}
          y2={sy(0)}
          stroke="var(--ink-muted)"
          strokeWidth={1}
        />

        <line
          x1={m.l}
          x2={W - m.r}
          y1={sy(lambda)}
          y2={sy(lambda)}
          stroke="var(--accent-expected)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        <polyline
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={1.4}
          strokeLinejoin="round"
          points={pathPoints}
        />

        {hoverIdx !== null && (
          <g>
            <line
              x1={sx(hoverIdx)}
              x2={sx(hoverIdx)}
              y1={m.t}
              y2={sy(0)}
              stroke="var(--ink-muted)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle
              cx={sx(hoverIdx)}
              cy={sy(data[hoverIdx])}
              r={3.5}
              fill="var(--accent-primary)"
              stroke="var(--bg-plate)"
              strokeWidth={1.5}
            />
          </g>
        )}

        <rect
          x={m.l}
          y={m.t}
          width={W - m.l - m.r}
          height={H - m.t - m.b}
          fill="transparent"
          className="cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.max(0, Math.min(n - 1, Math.round(relX * (n - 1))));
            setHoverIdx(idx);
          }}
        />
      </svg>
    </div>
  );
};

interface PoissonFitChartProps {
  data: number[];
  lambda: number;
  slotMin: number;
}

export const PoissonFitChart: React.FC<PoissonFitChartProps> = ({ data, lambda, slotMin }) => {
  const [hoverX, setHoverX] = useState<number | null>(null);

  const N = data.length;
  const lo = Math.max(0, Math.min(...data) - 2);
  const hi = Math.max(...data) + 2;

  const obsMap = useMemo(() => {
    const map: Record<number, number> = {};
    data.forEach((v) => {
      map[v] = (map[v] || 0) + 1;
    });
    return map;
  }, [data]);

  const bins = useMemo(() => {
    const arr: { x: number; obs: number; exp: number; prob: number }[] = [];
    for (let x = lo; x <= hi; x++) {
      const prob = poissonPmf(lambda, x);
      arr.push({ x, obs: obsMap[x] || 0, exp: N * prob, prob });
    }
    return arr;
  }, [lo, hi, obsMap, N, lambda]);

  const yMaxRaw = Math.max(...bins.map((b) => Math.max(b.obs, b.exp)), 1);
  const yTicks = niceTicks(yMaxRaw * 1.1, 4);
  const yMax = yTicks[yTicks.length - 1];
  const xTicks = stepTicks(lo, hi, 12);

  const W = 640;
  const H = 290;
  const m = { l: 48, r: 16, t: 16, b: 44 };

  const sx = (v: number) => m.l + ((v - (lo - 0.5)) / (hi + 0.5 - (lo - 0.5))) * (W - m.l - m.r);
  const sy = (v: number) => H - m.b - (v / yMax) * (H - m.t - m.b);
  const barWidth = Math.max(2, (sx(lo + 1) - sx(lo)) * 0.76);

  const hoveredBin = hoverX !== null ? bins.find((b) => b.x === hoverX) : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[var(--accent-primary)] opacity-85" />
            Observed slots
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-[var(--accent-expected)]" />
            Expected (Poisson)
          </span>
        </div>
        <div className="font-mono-tabular text-[var(--ink-primary)]">
          {hoveredBin ? (
            <span>
              x = {hoveredBin.x}: O = <strong>{hoveredBin.obs}</strong>, E ={' '}
              <strong>{fmt(hoveredBin.exp, 2)}</strong> (P = {fmt(hoveredBin.prob, 4)})
            </span>
          ) : (
            <span className="text-[var(--ink-muted)]">Hover bars to inspect O vs E</span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full select-none"
        role="img"
        aria-label="Observed vehicle counts compared with Poisson expected frequencies"
        onMouseLeave={() => setHoverX(null)}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={m.l}
              x2={W - m.r}
              y1={sy(t)}
              y2={sy(t)}
              stroke="var(--rule-hairline)"
              strokeWidth={1}
            />
            <text
              x={m.l - 7}
              y={sy(t) + 3.5}
              textAnchor="end"
              fill="var(--ink-muted)"
              fontSize="11"
              className="font-mono-tabular"
            >
              {formatTick(t)}
            </text>
          </g>
        ))}

        {xTicks.map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={H - m.b + 16}
            textAnchor="middle"
            fill="var(--ink-muted)"
            fontSize="11"
            className="font-mono-tabular"
          >
            {formatTick(t)}
          </text>
        ))}

        <line
          x1={m.l}
          x2={W - m.r}
          y1={sy(0)}
          y2={sy(0)}
          stroke="var(--ink-muted)"
          strokeWidth={1}
        />

        <text
          x={(m.l + W - m.r) / 2}
          y={H - 6}
          textAnchor="middle"
          fill="var(--ink-muted)"
          fontSize="11.5"
        >
          Vehicles per {slotMin}-minute slot
        </text>
        <text
          x={13}
          y={(m.t + H - m.b) / 2}
          textAnchor="middle"
          fill="var(--ink-muted)"
          fontSize="11.5"
          transform={`rotate(-90 13 ${(m.t + H - m.b) / 2})`}
        >
          Number of slots
        </text>

        {bins.map((b) => {
          const isHovered = hoverX === b.x;
          return (
            <g key={b.x}>
              {b.obs > 0 && (
                <rect
                  x={sx(b.x) - barWidth / 2}
                  y={sy(b.obs)}
                  width={barWidth}
                  height={Math.max(0, sy(0) - sy(b.obs))}
                  fill="var(--accent-primary)"
                  opacity={isHovered ? 1 : 0.78}
                />
              )}
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="var(--accent-expected)"
          strokeWidth={2}
          points={bins.map((b) => `${sx(b.x).toFixed(1)},${sy(b.exp).toFixed(1)}`).join(' ')}
        />

        {bins.map((b) => (
          <circle
            key={`pt-${b.x}`}
            cx={sx(b.x)}
            cy={sy(b.exp)}
            r={hoverX === b.x ? 4 : 2.3}
            fill="var(--accent-expected)"
          />
        ))}

        {/* Invisible column hit targets for smooth hover */}
        {bins.map((b) => {
          const colW = sx(lo + 1) - sx(lo);
          return (
            <rect
              key={`hit-${b.x}`}
              x={sx(b.x) - colW / 2}
              y={m.t}
              width={colW}
              height={H - m.t - m.b}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoverX(b.x)}
            />
          );
        })}
      </svg>
    </div>
  );
};

interface StateRibbonProps {
  states: number[];
}

export const StateRibbon: React.FC<StateRibbonProps> = ({ states }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const labels = ['Light', 'Moderate', 'Heavy'];
  const colors = ['var(--rule-hairline)', 'var(--accent-primary)', 'var(--accent-expected)'];

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[var(--rule-hairline)] border border-[var(--ink-muted)]/30" />
            Light
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[var(--accent-primary)] opacity-70" />
            Moderate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[var(--accent-expected)]" />
            Heavy
          </span>
        </div>
        <span className="font-mono-tabular text-[var(--ink-secondary)]">
          {hoverIdx !== null ? `Slot #${hoverIdx + 1}: ${labels[states[hoverIdx]]}` : 'Sequence strip'}
        </span>
      </div>
      <div
        className="flex h-4 w-full overflow-hidden border border-[var(--rule-hairline)]"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {states.map((st, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoverIdx(idx)}
            style={{
              backgroundColor: colors[st],
              opacity: st === 1 ? 0.72 : 1,
              flex: '1 1 0%',
            }}
            className="h-full transition-opacity duration-75 hover:opacity-100"
            title={`Slot ${idx + 1}: ${labels[st]}`}
          />
        ))}
      </div>
    </div>
  );
};

interface GapHistogramChartProps {
  gaps: number[];
}

export const GapHistogramChart: React.FC<GapHistogramChartProps> = ({ gaps }) => {
  const [hoverBin, setHoverBin] = useState<number | null>(null);

  const mGap = mean(gaps);
  const rate = 1 / mGap;
  const maxGap = Math.max(...gaps);
  const nBins = Math.min(14, Math.max(5, Math.round(Math.sqrt(gaps.length))));
  const binWidth = maxGap / nBins;

  const bins = useMemo(() => {
    const obs = new Array(nBins).fill(0);
    gaps.forEach((v) => {
      obs[Math.min(nBins - 1, Math.floor(v / binWidth))] += 1;
    });
    return obs.map((o, i) => {
      const lo = i * binWidth;
      const hi = (i + 1) * binWidth;
      const prob = Math.exp(-rate * lo) - (i === nBins - 1 ? 0 : Math.exp(-rate * hi));
      return { i, lo, hi, obs: o, exp: gaps.length * prob };
    });
  }, [gaps, nBins, binWidth, rate]);

  const yMaxRaw = Math.max(...bins.map((b) => Math.max(b.obs, b.exp)), 1);
  const yTicks = niceTicks(yMaxRaw * 1.1, 4);
  const yMax = yTicks[yTicks.length - 1];
  const xTicks = niceTicks(maxGap, 6).filter((t) => t <= maxGap);

  const W = 640;
  const H = 265;
  const m = { l: 48, r: 16, t: 16, b: 44 };

  const sx = (v: number) => m.l + (v / maxGap) * (W - m.l - m.r);
  const sy = (v: number) => H - m.b - (v / yMax) * (H - m.t - m.b);

  const active = hoverBin !== null ? bins[hoverBin] : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-[var(--accent-primary)] opacity-85" />
            Observed gaps
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-[var(--accent-expected)]" />
            Expected (Exponential)
          </span>
        </div>
        <div className="font-mono-tabular text-[var(--ink-primary)]">
          {active ? (
            <span>
              {fmt(active.lo, 1)}–{fmt(active.hi, 1)} s: O = <strong>{active.obs}</strong>, E ={' '}
              <strong>{fmt(active.exp, 1)}</strong>
            </span>
          ) : (
            <span className="text-[var(--ink-muted)]">Hover bins to inspect gap counts</span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full select-none"
        role="img"
        aria-label="Histogram of inter-arrival gaps with fitted exponential curve"
        onMouseLeave={() => setHoverBin(null)}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={m.l}
              x2={W - m.r}
              y1={sy(t)}
              y2={sy(t)}
              stroke="var(--rule-hairline)"
              strokeWidth={1}
            />
            <text
              x={m.l - 7}
              y={sy(t) + 3.5}
              textAnchor="end"
              fill="var(--ink-muted)"
              fontSize="11"
              className="font-mono-tabular"
            >
              {formatTick(t)}
            </text>
          </g>
        ))}

        {xTicks.map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={H - m.b + 16}
            textAnchor="middle"
            fill="var(--ink-muted)"
            fontSize="11"
            className="font-mono-tabular"
          >
            {formatTick(t)}
          </text>
        ))}

        <line
          x1={m.l}
          x2={W - m.r}
          y1={sy(0)}
          y2={sy(0)}
          stroke="var(--ink-muted)"
          strokeWidth={1}
        />

        <text
          x={(m.l + W - m.r) / 2}
          y={H - 6}
          textAnchor="middle"
          fill="var(--ink-muted)"
          fontSize="11.5"
        >
          Gap between consecutive vehicles (seconds)
        </text>
        <text
          x={13}
          y={(m.t + H - m.b) / 2}
          textAnchor="middle"
          fill="var(--ink-muted)"
          fontSize="11.5"
          transform={`rotate(-90 13 ${(m.t + H - m.b) / 2})`}
        >
          Number of gaps
        </text>

        {bins.map((b) => {
          const x0 = sx(b.lo) + 1.5;
          const x1 = sx(b.hi) - 1.5;
          const isHovered = hoverBin === b.i;
          return (
            <g key={b.i}>
              {b.obs > 0 && (
                <rect
                  x={x0}
                  y={sy(b.obs)}
                  width={Math.max(1, x1 - x0)}
                  height={Math.max(0, sy(0) - sy(b.obs))}
                  fill="var(--accent-primary)"
                  opacity={isHovered ? 1 : 0.78}
                />
              )}
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="var(--accent-expected)"
          strokeWidth={2}
          points={bins
            .map((b) => `${sx((b.lo + b.hi) / 2).toFixed(1)},${sy(b.exp).toFixed(1)}`)
            .join(' ')}
        />

        {bins.map((b) => (
          <circle
            key={`dot-${b.i}`}
            cx={sx((b.lo + b.hi) / 2)}
            cy={sy(b.exp)}
            r={hoverBin === b.i ? 4 : 2.3}
            fill="var(--accent-expected)"
          />
        ))}

        {bins.map((b) => (
          <rect
            key={`hit-${b.i}`}
            x={sx(b.lo)}
            y={m.t}
            width={Math.max(1, sx(b.hi) - sx(b.lo))}
            height={H - m.t - m.b}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => setHoverBin(b.i)}
          />
        ))}
      </svg>
    </div>
  );
};

interface NormalQQChartProps {
  data: number[];
}

export const NormalQQChart: React.FC<NormalQQChartProps> = ({ data }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const mVal = mean(data);
  const sdVal = Math.sqrt(variance(data));

  const points = useMemo(() => {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    return sorted.map((obs, i) => ({
      obs,
      theo: mVal + sdVal * probit((i + 0.5) / n),
    }));
  }, [data, mVal, sdVal]);

  const lo = Math.floor(Math.min(points[0].obs, points[0].theo));
  const hi = Math.ceil(Math.max(points[points.length - 1].obs, points[points.length - 1].theo));
  const range = Math.max(1, hi - lo);
  const ticks = niceTicks(range, 5)
    .map((v) => v + lo)
    .filter((v) => v <= hi);

  const W = 640;
  const H = 265;
  const m = { l: 48, r: 18, t: 16, b: 44 };

  const sx = (v: number) => m.l + ((v - lo) / range) * (W - m.l - m.r);
  const sy = (v: number) => H - m.b - ((v - lo) / range) * (H - m.t - m.b);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[var(--ink-muted)]">
          Normal Q-Q plot (μ = {fmt(mVal, 2)}, σ = {fmt(sdVal, 2)})
        </span>
        <span className="font-mono-tabular text-[var(--ink-primary)]">
          {hoverIdx !== null ? (
            <span>
              Expected: <strong>{fmt(points[hoverIdx].theo, 1)}</strong> · Observed:{' '}
              <strong>{points[hoverIdx].obs}</strong>
            </span>
          ) : (
            <span className="text-[var(--ink-muted)]">Hover points to compare quantiles</span>
          )}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full select-none"
        role="img"
        aria-label="Normal Q-Q plot of slot counts"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {ticks.map((t) => (
          <g key={`y-${t}`}>
            <line
              x1={m.l}
              x2={W - m.r}
              y1={sy(t)}
              y2={sy(t)}
              stroke="var(--rule-hairline)"
              strokeWidth={1}
            />
            <text
              x={m.l - 7}
              y={sy(t) + 3.5}
              textAnchor="end"
              fill="var(--ink-muted)"
              fontSize="11"
              className="font-mono-tabular"
            >
              {formatTick(t)}
            </text>
          </g>
        ))}

        {ticks.map((t) => (
          <text
            key={`x-${t}`}
            x={sx(t)}
            y={H - m.b + 16}
            textAnchor="middle"
            fill="var(--ink-muted)"
            fontSize="11"
            className="font-mono-tabular"
          >
            {formatTick(t)}
          </text>
        ))}

        <line
          x1={m.l}
          x2={W - m.r}
          y1={sy(lo)}
          y2={sy(lo)}
          stroke="var(--ink-muted)"
          strokeWidth={1}
        />

        <line
          x1={sx(lo)}
          y1={sy(lo)}
          x2={sx(hi)}
          y2={sy(hi)}
          stroke="var(--accent-expected)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />

        <text
          x={(m.l + W - m.r) / 2}
          y={H - 6}
          textAnchor="middle"
          fill="var(--ink-muted)"
          fontSize="11.5"
        >
          Expected count under Normal
        </text>
        <text
          x={13}
          y={(m.t + H - m.b) / 2}
          textAnchor="middle"
          fill="var(--ink-muted)"
          fontSize="11.5"
          transform={`rotate(-90 13 ${(m.t + H - m.b) / 2})`}
        >
          Observed count
        </text>

        {points.map((pt, idx) => (
          <circle
            key={idx}
            cx={sx(pt.theo)}
            cy={sy(pt.obs)}
            r={hoverIdx === idx ? 4.5 : 2.6}
            fill="var(--accent-primary)"
            opacity={hoverIdx === idx ? 1 : 0.65}
            className="cursor-crosshair"
            onMouseEnter={() => setHoverIdx(idx)}
          />
        ))}
      </svg>
    </div>
  );
};
