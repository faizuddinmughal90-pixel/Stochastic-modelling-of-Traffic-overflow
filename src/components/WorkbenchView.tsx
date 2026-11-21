import React from 'react';
import {
  buildPoissonClasses,
  chiSquareCritical,
  chiSquareSf,
  computeMarkov,
  fmt,
  mean,
  parseNumericList,
  quantileSorted,
  STATE_NAMES,
  variance,
  VEHICLE_TYPES,
  VehicleDataset,
  VehicleKey,
} from '../lib/statistics';
import {
  GapHistogramChart,
  NormalQQChart,
  PoissonFitChart,
  SlotSequenceChart,
  StateRibbon,
} from './Charts';

interface WorkbenchViewProps {
  store: Record<VehicleKey, VehicleDataset>;
  activeVehicle: VehicleKey;
  onSelectVehicle: (key: VehicleKey) => void;
  onUpdateDataset: (patch: Partial<VehicleDataset>) => void;
  onLoadPreset: (preset: 'steady' | 'bunched' | 'slide11' | 'clear') => void;
  bandLowOverride: number | null;
  bandHighOverride: number | null;
  onChangeBands: (low: number | null, high: number | null) => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  store,
  activeVehicle,
  onSelectVehicle,
  onUpdateDataset,
  onLoadPreset,
  bandLowOverride,
  bandHighOverride,
  onChangeBands,
}) => {
  const dataset = store[activeVehicle];
  const parsedCounts = parseNumericList(dataset.countsText, 'count');
  const parsedGaps = parseNumericList(dataset.gapsText, 'gap');

  const counts = parsedCounts.values;
  const gaps = parsedGaps.values;
  const hasCounts = !parsedCounts.error && counts.length >= 3;
  const slotMin = Math.max(1, Number(dataset.slotMin) || 10);

  const sampleMean = hasCounts ? mean(counts) : NaN;
  const sampleVar = hasCounts ? variance(counts) : NaN;
  const lamOverrideNum = Number(dataset.lamOverride.trim());
  const lamUsed =
    dataset.lamOverride.trim() !== '' && Number.isFinite(lamOverrideNum) && lamOverrideNum > 0
      ? lamOverrideNum
      : sampleMean;

  const canFitPoisson = hasCounts && (sampleMean > 0 || (dataset.lamOverride.trim() !== '' && lamUsed > 0));
  const dispersion = Number.isFinite(sampleMean) && sampleMean > 0 ? sampleVar / sampleMean : NaN;

  // Dispersion diagnostic
  let dispersionSymbol = '●';
  let dispersionTone = 'text-[var(--status-good)]';
  let dispersionTitle = 'Consistent with Poisson (≈ 1)';
  let dispersionDesc = 'Sample variance is close to the mean, supporting independent arrivals.';
  if (!Number.isFinite(dispersion)) {
    dispersionSymbol = '–';
    dispersionTone = 'text-[var(--ink-muted)]';
    dispersionTitle = 'Not available';
    dispersionDesc = 'Need non-zero mean count to compute dispersion.';
  } else if (dispersion > 1.2) {
    dispersionSymbol = '▲';
    dispersionTone = 'text-[var(--status-warn)]';
    dispersionTitle = 'Overdispersed — bunching (> 1)';
    dispersionDesc = 'Variance exceeds mean, typical of signal platoons or shifting arrival rates.';
  } else if (dispersion < 0.8) {
    dispersionSymbol = '▼';
    dispersionTone = 'text-[var(--status-warn)]';
    dispersionTitle = 'Underdispersed (< 1)';
    dispersionDesc = 'Arrivals are more regular and evenly spaced than a pure Poisson process.';
  }

  // Poisson classes & Chi-square
  const poissonClasses = canFitPoisson ? buildPoissonClasses(counts, lamUsed) : [];
  const chiStat = poissonClasses.reduce((s, c) => s + c.chiPart, 0);
  const dof = poissonClasses.length - 2;
  const chiP = dof >= 1 ? chiSquareSf(chiStat, dof) : NaN;
  const chiCrit = dof >= 1 ? chiSquareCritical(dof, 0.05) : NaN;
  const chiRejected = dof >= 1 && chiP < 0.05;

  // Markov chain bands
  const sortedCounts = hasCounts ? [...counts].sort((a, b) => a - b) : [];
  const defaultLow = hasCounts ? quantileSorted(sortedCounts, 1 / 3) : 0;
  const defaultHigh = hasCounts
    ? quantileSorted(sortedCounts, 2 / 3) +
      (quantileSorted(sortedCounts, 2 / 3) === defaultLow ? 1 : 0)
    : 1;
  const bandLow = bandLowOverride !== null ? bandLowOverride : defaultLow;
  const bandHigh = bandHighOverride !== null ? bandHighOverride : defaultHigh;
  const bandsValid = Number.isFinite(bandLow) && Number.isFinite(bandHigh) && bandLow < bandHigh;
  const markovResult = hasCounts && bandsValid ? computeMarkov(counts, bandLow, bandHigh) : null;

  // Vehicle mix across individual classes
  const mixEntries = VEHICLE_TYPES.slice(1).map((vt) => {
    const p = parseNumericList(store[vt.key].countsText, 'count');
    const sum = p.error ? 0 : p.values.reduce((acc, v) => acc + v, 0);
    return { ...vt, total: sum };
  });
  const totalMixVehicles = mixEntries.reduce((acc, e) => acc + e.total, 0);

  // Gaps analysis
  const hasGaps = !parsedGaps.error && gaps.length >= 5;
  const gapMean = hasGaps ? mean(gaps) : NaN;
  const gapSd = hasGaps ? Math.sqrt(variance(gaps)) : NaN;
  const gapRate = hasGaps && gapMean > 0 ? 1 / gapMean : NaN;
  const gapRatio = hasGaps && gapMean > 0 ? gapSd / gapMean : NaN;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[350px_minmax(0,1fr)] lg:items-start">
      {/* LEFT PARAMETER & INPUT RAIL */}
      <aside className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-5 lg:sticky lg:top-6">
        <div className="border-b border-[var(--rule-hairline)] pb-4">
          <h2 className="text-lg font-semibold text-[var(--ink-primary)]">Survey Input</h2>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Treat each time period separately and fit a distinct λ per vehicle class.
          </p>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="wb-vtype"
              className="mb-1.5 block text-xs font-semibold text-[var(--ink-secondary)]"
            >
              Vehicle class
            </label>
            <select
              id="wb-vtype"
              value={activeVehicle}
              onChange={(e) => onSelectVehicle(e.target.value as VehicleKey)}
              className="w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              {VEHICLE_TYPES.map((vt) => {
                const countN = parseNumericList(store[vt.key].countsText, 'count').values.length;
                return (
                  <option key={vt.key} value={vt.key}>
                    {vt.label}
                    {countN > 0 ? ` (${countN} slots)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="wb-counts"
                className="text-xs font-semibold text-[var(--ink-secondary)]"
              >
                Counts per time slot
              </label>
              <span className="font-mono-tabular text-[11px] text-[var(--ink-muted)]">
                {counts.length > 0 ? `${counts.length} slots` : 'Empty'}
              </span>
            </div>
            <textarea
              id="wb-counts"
              rows={4}
              spellCheck={false}
              value={dataset.countsText}
              onChange={(e) => onUpdateDataset({ countsText: e.target.value })}
              placeholder="e.g. 34, 41, 38, 45, 29..."
              className="font-mono-tabular w-full resize-y border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
            {parsedCounts.error && (
              <p role="alert" className="mt-1 text-xs text-[var(--status-bad)]">
                {parsedCounts.error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="wb-slotmin"
                className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]"
              >
                Slot length (min)
              </label>
              <input
                id="wb-slotmin"
                type="number"
                min={1}
                step={1}
                value={dataset.slotMin}
                onChange={(e) => onUpdateDataset({ slotMin: e.target.value })}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="wb-lamover"
                className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]"
              >
                Test λ override
              </label>
              <input
                id="wb-lamover"
                type="number"
                min={0}
                step="any"
                placeholder="from data"
                value={dataset.lamOverride}
                onChange={(e) => onUpdateDataset({ lamOverride: e.target.value })}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-secondary)]">
              Illustrative browser samples
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onLoadPreset('steady')}
                className="border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-left text-xs font-medium text-[var(--ink-primary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] whitespace-nowrap shrink-0"
              >
                Steady Poisson
              </button>
              <button
                type="button"
                onClick={() => onLoadPreset('bunched')}
                className="border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-left text-xs font-medium text-[var(--ink-primary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] whitespace-nowrap shrink-0"
              >
                Bunched (signal)
              </button>
              <button
                type="button"
                onClick={() => onLoadPreset('slide11')}
                className="border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-left text-xs font-medium text-[var(--ink-primary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] whitespace-nowrap shrink-0"
              >
                Slide 11 example
              </button>
              <button
                type="button"
                onClick={() => onLoadPreset('clear')}
                className="border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-left text-xs font-medium text-[var(--ink-muted)] transition-colors hover:border-[var(--status-bad)] hover:text-[var(--status-bad)] whitespace-nowrap shrink-0"
              >
                Clear fields
              </button>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-[var(--ink-muted)]">
              Samples are synthetically generated in your browser for demonstration and are not field survey records.
            </p>
          </div>

          <div className="border-t border-[var(--rule-hairline)] pt-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="wb-gaps"
                className="text-xs font-semibold text-[var(--ink-secondary)]"
              >
                Arrival gaps in seconds (optional)
              </label>
              <span className="font-mono-tabular text-[11px] text-[var(--ink-muted)]">
                {gaps.length > 0 ? `${gaps.length} gaps` : 'None'}
              </span>
            </div>
            <textarea
              id="wb-gaps"
              rows={3}
              spellCheck={false}
              value={dataset.gapsText}
              onChange={(e) => onUpdateDataset({ gapsText: e.target.value })}
              placeholder="e.g. 12, 4.5, 31, 9..."
              className="font-mono-tabular w-full resize-y border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
            {parsedGaps.error && (
              <p role="alert" className="mt-1 text-xs text-[var(--status-bad)]">
                {parsedGaps.error}
              </p>
            )}
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
              Requires exact arrival timestamps; feeds the Exponential gap check.
            </p>
          </div>

          <div className="border-t border-[var(--rule-hairline)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--ink-primary)]">Vehicle mix</h3>
            {totalMixVehicles === 0 ? (
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                Select individual vehicle types above and enter counts to compute modal share across the entry point.
              </p>
            ) : (
              <div className="mt-2.5 space-y-2">
                {mixEntries
                  .filter((e) => e.total > 0)
                  .map((entry) => {
                    const pct = (entry.total / totalMixVehicles) * 100;
                    return (
                      <div key={entry.key} className="grid grid-cols-[90px_1fr_48px] items-center gap-2 text-xs">
                        <span className="truncate text-[var(--ink-secondary)]">{entry.shortLabel}</span>
                        <div className="h-2 w-full bg-[var(--bg-subtle)]">
                          <div
                            className="h-full bg-[var(--accent-primary)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono-tabular text-right text-[var(--ink-primary)]">
                          {fmt(pct, 1)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT ANALYTICAL STAGE */}
      <div className="space-y-10 min-w-0">
        {/* 1. SUMMARY & DISPERSION */}
        <section aria-labelledby="sec-summary">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2">
            <div>
              <span className="text-xs font-medium text-[var(--ink-muted)]">01. Exploratory Diagnostics</span>
              <h2 id="sec-summary" className="text-2xl font-semibold text-[var(--ink-primary)]">
                Summary and Dispersion Check
              </h2>
            </div>
            {canFitPoisson && (
              <span className={`text-xs font-semibold ${dispersionTone}`}>
                {dispersionSymbol} {dispersionTitle}
              </span>
            )}
          </div>

          {!canFitPoisson ? (
            <div className="border border-dashed border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-6 text-sm text-[var(--ink-muted)]">
              {hasCounts && sampleMean === 0
                ? 'All entered slot counts are 0, so there is no positive inflow rate to model.'
                : 'Enter at least 3 slot counts in the survey input column (or load a sample dataset) to run the statistical diagnostics.'}
            </div>
          ) : (
            <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)]">
              <div className="grid grid-cols-2 divide-y divide-[var(--rule-hairline)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <div className="p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    Survey Slots
                  </div>
                  <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[var(--ink-primary)]">
                    {counts.length}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--ink-muted)]">{slotMin}-min intervals</div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    Mean Rate (λ̂)
                  </div>
                  <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[var(--ink-primary)]">
                    {fmt(sampleMean, 2)}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--ink-muted)]">vehicles / slot</div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    Sample Variance (s²)
                  </div>
                  <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[var(--ink-primary)]">
                    {fmt(sampleVar, 2)}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--ink-muted)]">unbiased (n − 1)</div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    Dispersion Index
                  </div>
                  <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[var(--ink-primary)]">
                    {fmt(dispersion, 2)}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--ink-muted)]">variance / mean</div>
                </div>
              </div>

              <div className="border-t border-[var(--rule-hairline)] bg-[var(--bg-subtle)]/50 px-4 py-3 text-xs text-[var(--ink-secondary)]">
                <strong className={dispersionTone}>
                  {dispersionSymbol} {dispersionTitle}:
                </strong>{' '}
                {dispersionDesc} (The 0.8–1.2 band is used here as the practical ≈ 1 rule of thumb.)
              </div>

              <div className="border-t border-[var(--rule-hairline)] p-4">
                <SlotSequenceChart
                  data={counts}
                  lambda={sampleMean}
                  slotMin={slotMin}
                  bandLow={bandsValid ? bandLow : undefined}
                  bandHigh={bandsValid ? bandHigh : undefined}
                />
              </div>
            </div>
          )}
        </section>

        {/* 2. POISSON FIT & CHI-SQUARE */}
        <section aria-labelledby="sec-poisson">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2">
            <div>
              <span className="text-xs font-medium text-[var(--ink-muted)]">02. Goodness-of-Fit</span>
              <h2 id="sec-poisson" className="text-2xl font-semibold text-[var(--ink-primary)]">
                Poisson Fit and Chi-Square Test
              </h2>
            </div>
            {canFitPoisson && dof >= 1 && (
              <span
                className={`text-xs font-semibold ${
                  chiRejected ? 'text-[var(--status-bad)]' : 'text-[var(--status-good)]'
                }`}
              >
                {chiRejected ? '✖ Significant (Poisson rejected)' : '● Not significant (Poisson not rejected)'}
              </span>
            )}
          </div>
          <p className="mb-4 max-w-[72ch] text-sm text-[var(--ink-secondary)]">
            H₀: slot counts follow a Poisson distribution. Tail classes are merged until every expected frequency{' '}
            <span className="font-mono-tabular">E ≥ 5</span>. Degrees of freedom = classes − 2; significance level α = 0.05.
          </p>

          {!canFitPoisson ? (
            <div className="border border-dashed border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-6 text-sm text-[var(--ink-muted)]">
              Waiting for slot counts to fit the Poisson distribution.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
              <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-4">
                <PoissonFitChart data={counts} lambda={lamUsed} slotMin={slotMin} />
              </div>

              <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-4 flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex items-baseline justify-between text-xs text-[var(--ink-muted)]">
                    <span>
                      Parameter λ = <strong className="font-mono-tabular text-[var(--ink-primary)]">{fmt(lamUsed, 3)}</strong>
                    </span>
                    <span className="font-mono-tabular">N = {counts.length} slots</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="booktabs-table">
                      <thead>
                        <tr>
                          <th>Vehicles</th>
                          <th className="num">O</th>
                          <th className="num">E</th>
                          <th className="num">(O−E)²/E</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poissonClasses.map((cl, i) => (
                          <tr key={i}>
                            <td>{cl.label}</td>
                            <td className="num">{cl.O}</td>
                            <td className="num">{fmt(cl.E, 1)}</td>
                            <td className="num">{fmt(cl.chiPart, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td className="num">{counts.length}</td>
                          <td className="num">
                            {fmt(
                              poissonClasses.reduce((s, c) => s + c.E, 0),
                              1
                            )}
                          </td>
                          <td className="num">{fmt(chiStat, 2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="mt-4 border-t border-[var(--rule-hairline)] pt-3 text-xs leading-relaxed">
                  {dof < 1 ? (
                    <p className="text-[var(--status-warn)]">
                      Too few classes after merging ({poissonClasses.length}) to run a valid Chi-square test with this λ.
                    </p>
                  ) : (
                    <>
                      <div className="font-mono-tabular text-[var(--ink-primary)]">
                        χ² = <strong>{fmt(chiStat, 2)}</strong> · {dof} d.f. · critical ={' '}
                        <strong>{fmt(chiCrit, 2)}</strong> · p ≈ <strong>{fmt(chiP, 3)}</strong>
                      </div>
                      <p className={`mt-1 font-medium ${chiRejected ? 'text-[var(--status-bad)]' : 'text-[var(--status-good)]'}`}>
                        {chiRejected
                          ? '✖ Poisson is rejected at α = 0.05. A bad fit is also a finding: it points to signal bunching or a non-stationary rate.'
                          : '● Poisson is not rejected at α = 0.05. Observed counts align with random independent arrivals.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. MARKOV CHAIN */}
        <section aria-labelledby="sec-markov">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2">
            <div>
              <span className="text-xs font-medium text-[var(--ink-muted)]">03. Sequential Persistence</span>
              <h2 id="sec-markov" className="text-2xl font-semibold text-[var(--ink-primary)]">
                Three-State Markov Chain
              </h2>
            </div>
            {hasCounts && counts.length < 300 && (
              <span className="text-xs text-[var(--status-warn)]">
                ▲ Small sample ({counts.length} slots; ~300+ recommended for stable transitions)
              </span>
            )}
          </div>
          <p className="mb-4 max-w-[72ch] text-sm text-[var(--ink-secondary)]">
            Consecutive slots are classified into Light, Moderate, and Heavy regimes. Because state boundaries alter transition probabilities, thresholds remain transparent and editable.
          </p>

          {!hasCounts ? (
            <div className="border border-dashed border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-6 text-sm text-[var(--ink-muted)]">
              Waiting for slot counts to construct the transition matrix.
            </div>
          ) : (
            <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-5 space-y-5">
              {/* Controls + State counts */}
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--rule-hairline)] pb-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label htmlFor="mk-low" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                      Light (count ≤)
                    </label>
                    <input
                      id="mk-low"
                      type="number"
                      step={1}
                      value={bandLow}
                      onChange={(e) => onChangeBands(Number(e.target.value), bandHigh)}
                      className="font-mono-tabular w-24 border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="mk-high" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                      Heavy (count ≥)
                    </label>
                    <input
                      id="mk-high"
                      type="number"
                      step={1}
                      value={bandHigh}
                      onChange={(e) => onChangeBands(bandLow, Number(e.target.value))}
                      className="font-mono-tabular w-24 border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeBands(null, null)}
                    className="border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] whitespace-nowrap shrink-0"
                  >
                    Reset to thirds
                  </button>
                </div>

                {markovResult && (
                  <div className="font-mono-tabular text-xs text-[var(--ink-secondary)]">
                    Light ≤ {bandLow} ({markovResult.stateCounts[0]}) · Moderate {bandLow + 1}–{bandHigh - 1} ({markovResult.stateCounts[1]}) · Heavy ≥ {bandHigh} ({markovResult.stateCounts[2]})
                  </div>
                )}
              </div>

              {!bandsValid ? (
                <p role="alert" className="text-xs text-[var(--status-bad)]">
                  The Heavy threshold must be strictly greater than the Light threshold.
                </p>
              ) : (
                markovResult && (
                  <>
                    <StateRibbon states={markovResult.states} />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-[var(--ink-primary)]">
                          One-Step Transition Matrix P (observed counts)
                        </h3>
                        <table className="booktabs-table">
                          <thead>
                            <tr>
                              <th>From / To</th>
                              {STATE_NAMES.map((s) => (
                                <th key={s} className="num">
                                  {s}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {markovResult.P.map((row, i) => (
                              <tr key={STATE_NAMES[i]}>
                                <td className="font-medium">{STATE_NAMES[i]}</td>
                                {[0, 1, 2].map((j) => {
                                  const prob = row ? row[j] : null;
                                  const alpha = prob !== null ? Math.round(prob * 28) : 0;
                                  return (
                                    <td
                                      key={j}
                                      className="num"
                                      style={{
                                        backgroundColor:
                                          alpha > 0
                                            ? `color-mix(in srgb, var(--accent-primary) ${alpha}%, transparent)`
                                            : undefined,
                                      }}
                                    >
                                      {prob !== null ? fmt(prob, 2) : '–'}{' '}
                                      <span className="text-[11px] text-[var(--ink-muted)]">
                                        ({markovResult.counts[i][j]})
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-[var(--ink-primary)]">
                          Two-Step Forecast P² &amp; Stationary Share π
                        </h3>
                        {markovResult.P2 && markovResult.stationary ? (
                          <>
                            <table className="booktabs-table">
                              <thead>
                                <tr>
                                  <th>From / +2 slots</th>
                                  {STATE_NAMES.map((s) => (
                                    <th key={s} className="num">
                                      {s}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {markovResult.P2.map((row, i) => (
                                  <tr key={STATE_NAMES[i]}>
                                    <td className="font-medium">{STATE_NAMES[i]}</td>
                                    {row.map((val, j) => (
                                      <td key={j} className="num">
                                        {fmt(val, 2)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="mt-4 border-t border-[var(--rule-hairline)] pt-3">
                              <div className="text-xs font-medium text-[var(--ink-muted)]">
                                Long-run equilibrium share of time (π)
                              </div>
                              <div className="font-mono-tabular mt-1.5 flex flex-wrap gap-5 text-sm font-semibold text-[var(--ink-primary)]">
                                {STATE_NAMES.map((name, idx) => (
                                  <span key={name}>
                                    {name}: {Math.round(markovResult.stationary![idx] * 100)}%
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-[var(--ink-muted)]">
                            At least one state has zero observed occurrences under the current thresholds, so two-step and stationary estimates cannot be computed.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          )}
        </section>

        {/* 4. EXPONENTIAL CHECK ON GAPS */}
        <section aria-labelledby="sec-gaps">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2">
            <div>
              <span className="text-xs font-medium text-[var(--ink-muted)]">04. Inter-Arrival Headways</span>
              <h2 id="sec-gaps" className="text-2xl font-semibold text-[var(--ink-primary)]">
                Exponential Check on Vehicle Gaps
              </h2>
            </div>
            {hasGaps && (
              <span
                className={`text-xs font-semibold ${
                  Math.abs(gapRatio - 1) <= 0.2 ? 'text-[var(--status-good)]' : 'text-[var(--status-warn)]'
                }`}
              >
                {Math.abs(gapRatio - 1) <= 0.2 ? '●' : '▲'} SD / mean = {fmt(gapRatio, 2)}
              </span>
            )}
          </div>

          {!hasGaps ? (
            <div className="border border-dashed border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-6 text-sm text-[var(--ink-muted)]">
              Add at least 5 inter-arrival gap values (in seconds) in the Survey Input panel to inspect the Exponential headway fit. If arrivals are Poisson, the standard deviation of gaps should be close to their mean.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
              <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-4">
                <GapHistogramChart gaps={gaps} />
              </div>

              <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-4 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-4 border-b border-[var(--rule-hairline)] pb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">Gaps (n)</div>
                    <div className="font-mono-tabular text-xl font-semibold text-[var(--ink-primary)]">
                      {gaps.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">Mean gap (1/r)</div>
                    <div className="font-mono-tabular text-xl font-semibold text-[var(--ink-primary)]">
                      {fmt(gapMean, 1)} s
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">Std dev</div>
                    <div className="font-mono-tabular text-xl font-semibold text-[var(--ink-primary)]">
                      {fmt(gapSd, 1)} s
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">Rate r</div>
                    <div className="font-mono-tabular text-xl font-semibold text-[var(--ink-primary)]">
                      {fmt(gapRate, 3)} /s
                    </div>
                  </div>
                </div>

                <div className="py-3 text-xs leading-relaxed text-[var(--ink-secondary)]">
                  {Math.abs(gapRatio - 1) <= 0.2 ? (
                    <span className="font-medium text-[var(--status-good)]">
                      ● Standard deviation is close to the mean, consistent with memoryless Exponential headways.
                    </span>
                  ) : gapRatio < 1 ? (
                    <span className="font-medium text-[var(--status-warn)]">
                      ▼ Gaps are more uniform than an Exponential process.
                    </span>
                  ) : (
                    <span className="font-medium text-[var(--status-warn)]">
                      ▲ Gaps vary more than Exponential (SD &gt; mean), indicating platoons and long empty intervals.
                    </span>
                  )}
                </div>

                <table className="booktabs-table">
                  <thead>
                    <tr>
                      <th>Headway threshold</th>
                      <th className="num">Expected</th>
                      <th className="num">Observed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Gap &gt; 30 s</td>
                      <td className="num">{fmt(Math.exp(-30 * gapRate), 3)}</td>
                      <td className="num">{fmt(gaps.filter((v) => v > 30).length / gaps.length, 3)}</td>
                    </tr>
                    <tr>
                      <td>Gap &lt; 5 s</td>
                      <td className="num">{fmt(1 - Math.exp(-5 * gapRate), 3)}</td>
                      <td className="num">{fmt(gaps.filter((v) => v < 5).length / gaps.length, 3)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
                  Formal Kolmogorov-Smirnov test is outside the scope of this browser prototype.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 5. NORMAL Q-Q CHECK */}
        <section aria-labelledby="sec-qq">
          <div className="mb-3 border-b border-[var(--rule-hairline)] pb-2">
            <span className="text-xs font-medium text-[var(--ink-muted)]">05. High-Volume Approximation</span>
            <h2 id="sec-qq" className="text-2xl font-semibold text-[var(--ink-primary)]">
              Normal Check for Busy Periods
            </h2>
          </div>
          <p className="mb-4 max-w-[72ch] text-sm text-[var(--ink-secondary)]">
            Applicable when the average inflow exceeds roughly 20 vehicles per slot. For sparse classes such as buses and trucks, remain with Poisson.
          </p>

          {!hasCounts ? (
            <div className="border border-dashed border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-6 text-sm text-[var(--ink-muted)]">
              Waiting for slot counts.
            </div>
          ) : sampleMean <= 20 ? (
            <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-5 text-sm text-[var(--ink-secondary)]">
              Mean inflow is <strong className="font-mono-tabular">{fmt(sampleMean, 1)}</strong> vehicles per slot (≤ 20). The Normal approximation is not recommended at this volume; stay with the exact Poisson fit above.
            </div>
          ) : (
            <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-4">
              <NormalQQChart data={counts} />
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                Points aligned along the dashed diagonal indicate approximate normality. The Shapiro-Wilk test is not included in this prototype.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
