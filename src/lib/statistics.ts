export type VehicleKey = 'all' | 'two' | 'car' | 'auto' | 'bus' | 'truck' | 'cycle';

export interface VehicleTypeOption {
  key: VehicleKey;
  label: string;
  shortLabel: string;
}

export const VEHICLE_TYPES: VehicleTypeOption[] = [
  { key: 'all', label: 'All vehicles (combined)', shortLabel: 'All vehicles' },
  { key: 'two', label: 'Two-wheeler', shortLabel: 'Two-wheeler' },
  { key: 'car', label: 'Car', shortLabel: 'Car' },
  { key: 'auto', label: 'Auto', shortLabel: 'Auto' },
  { key: 'bus', label: 'Bus', shortLabel: 'Bus' },
  { key: 'truck', label: 'Truck', shortLabel: 'Truck' },
  { key: 'cycle', label: 'Cycle', shortLabel: 'Cycle' },
];

export interface VehicleDataset {
  countsText: string;
  gapsText: string;
  slotMin: string;
  lamOverride: string;
}

export const EMPTY_DATASET: VehicleDataset = {
  countsText: '',
  gapsText: '',
  slotMin: '10',
  lamOverride: '',
};

export function lgamma(z: number): number {
  const c = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  let y = z;
  let t = z + 5.5;
  t -= (z + 0.5) * Math.log(t);
  let s = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    s += c[j] / ++y;
  }
  return -t + Math.log((2.5066282746310005 * s) / z);
}

export function poissonPmf(lambda: number, x: number): number {
  if (lambda <= 0) return x === 0 ? 1 : 0;
  if (x < 0) return 0;
  return Math.exp(-lambda + x * Math.log(lambda) - lgamma(x + 1));
}

export function poissonCdf(lambda: number, x: number): number {
  let sum = 0;
  for (let i = 0; i <= x; i++) {
    sum += poissonPmf(lambda, i);
  }
  return Math.min(1, sum);
}

function gser(a: number, x: number): number {
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < 500; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

function gcf(a: number, x: number): number {
  let b = x + 1 - a;
  let c = 1e300;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const dl = d * c;
    h *= dl;
    if (Math.abs(dl - 1) < 1e-14) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

export function chiSquareSf(x: number, k: number): number {
  if (x <= 0) return 1;
  const a = k / 2;
  const xx = x / 2;
  return xx < a + 1 ? 1 - gser(a, xx) : gcf(a, xx);
}

export function chiSquareCritical(k: number, alpha = 0.05): number {
  let lo = 0;
  let hi = 500;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (chiSquareSf(mid, k) > alpha) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-ax * ax);
  return sign * y;
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export function probit(p: number): number {
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return NaN;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

export function variance(arr: number[]): number {
  if (arr.length < 2) return NaN;
  const m = mean(arr);
  return arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1);
}

export function fmt(x: number, decimals = 3): string {
  return Number.isFinite(x) ? x.toFixed(decimals) : '–';
}

export function parseNumericList(
  text: string,
  kind: 'count' | 'gap'
): { values: number[]; error: string | null } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  const values: number[] = [];
  for (const part of parts) {
    const v = Number(part);
    if (!Number.isFinite(v)) {
      return { values: [], error: `“${part.slice(0, 14)}” is not a valid number.` };
    }
    if (kind === 'count' && (v < 0 || !Number.isInteger(v))) {
      return {
        values: [],
        error: `Counts must be whole numbers of 0 or more. Check “${part.slice(0, 14)}”.`,
      };
    }
    if (kind === 'gap' && v <= 0) {
      return {
        values: [],
        error: `Gaps must be greater than 0 seconds. Check “${part.slice(0, 14)}”.`,
      };
    }
    values.push(v);
  }
  return { values, error: null };
}

function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePoisson(lambda: number, rand: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rand();
  } while (p > L);
  return k - 1;
}

function sampleGauss(rand: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
}

export function generateSteadySample(): VehicleDataset {
  const r = createRng(7);
  const counts = Array.from({ length: 300 }, () => samplePoisson(40, r));
  const gaps = Array.from({ length: 200 }, () => +(-15 * Math.log(1 - r())).toFixed(1) || 0.1);
  return {
    countsText: counts.join(', '),
    gapsText: gaps.join(', '),
    slotMin: '10',
    lamOverride: '',
  };
}

export function generateBunchedSample(): VehicleDataset {
  const r = createRng(11);
  let state = 0;
  const counts = Array.from({ length: 300 }, () => {
    state = 0.9 * state + 0.44 * sampleGauss(r);
    return samplePoisson(Math.max(8, 40 + 12 * state), r);
  });
  const gaps = Array.from(
    { length: 200 },
    () => +(-(r() < 0.6 ? 6 : 30) * Math.log(1 - r())).toFixed(1) || 0.1
  );
  return {
    countsText: counts.join(', '),
    gapsText: gaps.join(', '),
    slotMin: '10',
    lamOverride: '',
  };
}

export function getSlide11Sample(): VehicleDataset {
  const counts: number[] = [];
  const freq: [number, number][] = [
    [0, 3],
    [1, 3],
    [2, 18],
    [3, 24],
    [4, 15],
    [5, 20],
    [6, 7],
    [7, 10],
  ];
  freq.forEach(([value, count]) => {
    for (let i = 0; i < count; i++) counts.push(value);
  });
  return {
    countsText: counts.join(', '),
    gapsText: '',
    slotMin: '5',
    lamOverride: '4',
  };
}

export interface PoissonClass {
  lo: number;
  hi: number;
  O: number;
  E: number;
  label: string;
  chiPart: number;
}

export function buildPoissonClasses(data: number[], lambda: number): PoissonClass[] {
  const N = data.length;
  const K = Math.max(...data);
  const raw: { lo: number; hi: number; O: number; E: number }[] = [];

  for (let x = 0; x < K; x++) {
    raw.push({ lo: x, hi: x, O: 0, E: N * poissonPmf(lambda, x) });
  }
  raw.push({
    lo: K,
    hi: Infinity,
    O: 0,
    E: N * (1 - (K > 0 ? poissonCdf(lambda, K - 1) : 0)),
  });

  data.forEach((v) => {
    raw[Math.min(v, K)].O += 1;
  });

  const mergeAt = (index: number) => {
    const a = raw[index];
    const b = raw[index + 1];
    raw.splice(index, 2, {
      lo: a.lo,
      hi: b.hi,
      O: a.O + b.O,
      E: a.E + b.E,
    });
  };

  while (raw.length > 1 && raw[0].E < 5) mergeAt(0);
  while (raw.length > 1 && raw[raw.length - 1].E < 5) mergeAt(raw.length - 2);

  return raw.map((c, idx) => {
    const label =
      c.lo === c.hi
        ? String(c.lo)
        : c.hi === Infinity
          ? `${c.lo} or more`
          : idx === 0
            ? `${c.hi} or fewer`
            : `${c.lo}–${c.hi}`;
    const chiPart = c.E > 0 ? (c.O - c.E) ** 2 / c.E : 0;
    return { ...c, label, chiPart };
  });
}

export function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

export const STATE_NAMES = ['Light', 'Moderate', 'Heavy'] as const;

export interface MarkovResult {
  counts: number[][];
  rowTotals: number[];
  P: (number[] | null)[];
  P2: number[][] | null;
  stationary: number[] | null;
  states: number[];
  stateCounts: [number, number, number];
}

export function matMul3(A: number[][], B: number[][]): number[][] {
  return A.map((row) =>
    [0, 1, 2].map((j) => row.reduce((sum, val, k) => sum + val * B[k][j], 0))
  );
}

export function stationaryDistribution(P: number[][]): number[] {
  let v = [1 / 3, 1 / 3, 1 / 3];
  for (let iter = 0; iter < 5000; iter++) {
    v = [0, 1, 2].map((j) => v.reduce((sum, vi, k) => sum + vi * P[k][j], 0));
  }
  return v;
}

export function computeMarkov(data: number[], bandLow: number, bandHigh: number): MarkovResult {
  const states = data.map((v) => (v <= bandLow ? 0 : v >= bandHigh ? 2 : 1));
  const stateCounts: [number, number, number] = [0, 0, 0];
  states.forEach((s) => {
    stateCounts[s] += 1;
  });

  const counts = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < states.length - 1; i++) {
    counts[states[i]][states[i + 1]] += 1;
  }

  const rowTotals = counts.map((r) => r[0] + r[1] + r[2]);
  const P = counts.map((r, i) => (rowTotals[i] > 0 ? r.map((v) => v / rowTotals[i]) : null));
  const complete = P.every((r): r is number[] => r !== null);
  const P2 = complete ? matMul3(P as number[][], P as number[][]) : null;
  const stationary = complete ? stationaryDistribution(P as number[][]) : null;

  return { counts, rowTotals, P, P2, stationary, states, stateCounts };
}

export function niceTicks(max: number, approxCount: number): number[] {
  const safeMax = max > 0 ? max : 1;
  const raw = safeMax / Math.max(1, approxCount);
  const power = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const mult = raw / power;
  const step = (mult <= 1 ? 1 : mult <= 2 ? 2 : mult <= 5 ? 5 : 10) * power;
  const ticks: number[] = [];
  for (let v = 0; v <= safeMax + step * 0.999; v += step) {
    ticks.push(+v.toFixed(6));
  }
  return ticks;
}

export function stepTicks(lo: number, hi: number, maxTicks: number): number[] {
  const step = Math.max(1, Math.ceil((hi - lo) / maxTicks));
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    ticks.push(v);
  }
  return ticks;
}

export function formatTick(v: number): string {
  return Math.abs(v) >= 1000 ? String(Math.round(v)) : String(+v.toFixed(2));
}
