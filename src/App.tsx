import React, { useEffect, useState } from 'react';
import { CalculatorsView } from './components/CalculatorsView';
import { MethodologyView } from './components/MethodologyView';
import { ReferencesView } from './components/ReferencesView';
import { WorkbenchView } from './components/WorkbenchView';
import {
  buildPoissonClasses,
  chiSquareCritical,
  chiSquareSf,
  computeMarkov,
  EMPTY_DATASET,
  fmt,
  generateBunchedSample,
  generateSteadySample,
  getSlide11Sample,
  mean,
  parseNumericList,
  quantileSorted,
  STATE_NAMES,
  variance,
  VEHICLE_TYPES,
  VehicleDataset,
  VehicleKey,
} from './lib/statistics';

type ViewTab = 'workbench' | 'calculators' | 'methodology' | 'references';

function createInitialStore(): Record<VehicleKey, VehicleDataset> {
  return {
    all: generateBunchedSample(),
    two: { ...EMPTY_DATASET },
    car: { ...EMPTY_DATASET },
    auto: { ...EMPTY_DATASET },
    bus: { ...EMPTY_DATASET },
    truck: { ...EMPTY_DATASET },
    cycle: { ...EMPTY_DATASET },
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('workbench');
  const [store, setStore] = useState<Record<VehicleKey, VehicleDataset>>(createInitialStore);
  const [activeVehicle, setActiveVehicle] = useState<VehicleKey>('all');
  const [bandLowOverride, setBandLowOverride] = useState<number | null>(null);
  const [bandHighOverride, setBandHighOverride] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const hash = window.location.hash.slice(1) as ViewTab;
    if (['workbench', 'calculators', 'methodology', 'references'].includes(hash)) {
      setActiveTab(hash);
    }
    const onHash = () => {
      const next = window.location.hash.slice(1) as ViewTab;
      if (['workbench', 'calculators', 'methodology', 'references'].includes(next)) {
        setActiveTab(next);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const selectTab = (tab: ViewTab) => {
    setActiveTab(tab);
    try {
      window.history.replaceState(null, '', `#${tab}`);
    } catch {
      window.location.hash = tab;
    }
  };

  const handleSelectVehicle = (key: VehicleKey) => {
    setActiveVehicle(key);
    setBandLowOverride(null);
    setBandHighOverride(null);
  };

  const handleUpdateDataset = (patch: Partial<VehicleDataset>) => {
    setStore((prev) => ({
      ...prev,
      [activeVehicle]: {
        ...prev[activeVehicle],
        ...patch,
      },
    }));
  };

  const handleLoadPreset = (preset: 'steady' | 'bunched' | 'slide11' | 'clear') => {
    let next: VehicleDataset;
    if (preset === 'steady') next = generateSteadySample();
    else if (preset === 'bunched') next = generateBunchedSample();
    else if (preset === 'slide11') next = getSlide11Sample();
    else next = { ...EMPTY_DATASET };

    setStore((prev) => ({
      ...prev,
      [activeVehicle]: next,
    }));
    setBandLowOverride(null);
    setBandHighOverride(null);
  };

  const handleExportSummary = () => {
    const ds = store[activeVehicle];
    const vehicleLabel = VEHICLE_TYPES.find((v) => v.key === activeVehicle)?.label ?? activeVehicle;
    const parsedCounts = parseNumericList(ds.countsText, 'count');
    const parsedGaps = parseNumericList(ds.gapsText, 'gap');

    const lines: string[] = [
      'STOCHASTIC MODELLING OF TRAFFIC INFLOW — ANALYSIS SUMMARY',
      `Vehicle Class: ${vehicleLabel}`,
      `Slot Length: ${ds.slotMin || '10'} minutes`,
      '------------------------------------------------------------',
    ];

    if (!parsedCounts.error && parsedCounts.values.length >= 3) {
      const counts = parsedCounts.values;
      const m = mean(counts);
      const v = variance(counts);
      const di = m > 0 ? v / m : NaN;
      const lamOv = Number(ds.lamOverride.trim());
      const lam = ds.lamOverride.trim() !== '' && lamOv > 0 ? lamOv : m;

      lines.push(`Slots (N): ${counts.length}`);
      lines.push(`Mean Count (lambda_hat): ${fmt(m, 3)}`);
      lines.push(`Sample Variance (s^2): ${fmt(v, 3)}`);
      lines.push(`Dispersion Index (s^2 / mean): ${fmt(di, 3)}`);
      lines.push('');

      if (lam > 0) {
        const classes = buildPoissonClasses(counts, lam);
        const chi = classes.reduce((s, c) => s + c.chiPart, 0);
        const dof = classes.length - 2;
        lines.push(`POISSON GOODNESS-OF-FIT (lambda = ${fmt(lam, 3)})`);
        classes.forEach((c) => {
          lines.push(`  ${c.label.padEnd(14)} O=${String(c.O).padStart(4)}  E=${fmt(c.E, 1).padStart(6)}  (O-E)^2/E=${fmt(c.chiPart, 2)}`);
        });
        if (dof >= 1) {
          const p = chiSquareSf(chi, dof);
          const crit = chiSquareCritical(dof, 0.05);
          lines.push(`  Chi-square = ${fmt(chi, 2)}, df = ${dof}, critical(0.05) = ${fmt(crit, 2)}, p = ${fmt(p, 3)}`);
          lines.push(`  Verdict: ${p < 0.05 ? 'Poisson rejected at alpha = 0.05' : 'Poisson not rejected at alpha = 0.05'}`);
        }
        lines.push('');
      }

      const sorted = [...counts].sort((a, b) => a - b);
      const bLow = bandLowOverride ?? quantileSorted(sorted, 1 / 3);
      const bHigh =
        bandHighOverride ??
        quantileSorted(sorted, 2 / 3) + (quantileSorted(sorted, 2 / 3) === bLow ? 1 : 0);
      if (bLow < bHigh) {
        const mk = computeMarkov(counts, bLow, bHigh);
        lines.push(`MARKOV CHAIN (Light <= ${bLow}, Heavy >= ${bHigh})`);
        mk.P.forEach((row, i) => {
          lines.push(
            `  From ${STATE_NAMES[i].padEnd(9)}: ${row ? row.map((p) => fmt(p, 2)).join('  ') : 'no transitions'}`
          );
        });
        if (mk.stationary) {
          lines.push(
            `  Stationary Share: ${STATE_NAMES.map((n, i) => `${n} ${Math.round(mk.stationary![i] * 100)}%`).join(' | ')}`
          );
        }
        lines.push('');
      }
    } else {
      lines.push('No valid slot counts (>= 3 values) entered for this vehicle class.');
      lines.push('');
    }

    if (!parsedGaps.error && parsedGaps.values.length >= 5) {
      const g = parsedGaps.values;
      const gm = mean(g);
      const gsd = Math.sqrt(variance(g));
      lines.push(`EXPONENTIAL HEADWAY CHECK (n = ${g.length} gaps)`);
      lines.push(`  Mean gap: ${fmt(gm, 2)} s | Std dev: ${fmt(gsd, 2)} s | SD/Mean: ${fmt(gsd / gm, 2)}`);
      lines.push(`  Estimated arrival rate r: ${fmt(1 / gm, 4)} /s`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-inflow-summary-${activeVehicle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--ink-primary)] transition-colors duration-150">
      {/* Strict 3-zone Top Bar */}
      <header className="border-b border-[var(--rule-hairline)] bg-[var(--bg-plate)]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <a
            href="#workbench"
            onClick={(e) => {
              e.preventDefault();
              selectTab('workbench');
            }}
            className="font-serif-display text-lg font-semibold tracking-tight text-[var(--ink-primary)] whitespace-nowrap shrink-0"
          >
            Traffic Inflow Lab
          </a>

          <nav aria-label="Primary sections" className="flex items-center gap-6 overflow-x-auto">
            {(
              [
                ['workbench', 'Workbench'],
                ['calculators', 'Calculators'],
                ['methodology', 'Methodology'],
                ['references', 'References'],
              ] as [ViewTab, string][]
            ).map(([key, label]) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectTab(key)}
                  aria-current={active ? 'page' : undefined}
                  className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                      : 'border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleExportSummary}
              className="bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0"
            >
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Editorial Study Masthead */}
        <section className="mb-8 border-b border-[var(--rule-strong)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-muted)]">
            <div className="flex flex-wrap items-center gap-2">
              <span>Applied Statistics &amp; Stochastic Processes</span>
              <span aria-hidden="true">·</span>
              <span>Group 7 Field Study</span>
              <span aria-hidden="true">·</span>
              <span>Slot-Based Inflow Analysis</span>
            </div>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--ink-primary)] whitespace-nowrap shrink-0 no-print"
            >
              {darkMode ? 'Light paper' : 'Dark slate'}
            </button>
          </div>

          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-[var(--ink-primary)] sm:text-4xl">
            Stochastic Modelling for the Traffic Inflow on Particular Demography
          </h1>
          <p className="mt-2.5 max-w-[72ch] text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            Count vehicles entering an area in fixed time slots, model counts and headways with Poisson, Exponential, and Markov chain methods, test goodness-of-fit via Chi-square, and compare traffic regimes across contrasting demographics.
          </p>
        </section>

        {/* Active View */}
        {activeTab === 'workbench' && (
          <WorkbenchView
            store={store}
            activeVehicle={activeVehicle}
            onSelectVehicle={handleSelectVehicle}
            onUpdateDataset={handleUpdateDataset}
            onLoadPreset={handleLoadPreset}
            bandLowOverride={bandLowOverride}
            bandHighOverride={bandHighOverride}
            onChangeBands={(low, high) => {
              setBandLowOverride(low);
              setBandHighOverride(high);
            }}
          />
        )}

        {activeTab === 'calculators' && (
          <CalculatorsView activeCountsText={store[activeVehicle].countsText} />
        )}

        {activeTab === 'methodology' && <MethodologyView />}

        {activeTab === 'references' && <ReferencesView />}
      </main>

      <footer className="mx-auto mt-12 max-w-[1240px] border-t border-[var(--rule-hairline)] px-4 py-6 text-xs text-[var(--ink-muted)] sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="font-medium text-[var(--ink-secondary)]">
            Group 7 · Submitted to Dr. Zaffar Mehdi Dar
          </div>
          <div className="font-mono-tabular">
            Slot-based stochastic inflow workbook
          </div>
        </div>
        <div className="mt-2 leading-relaxed">
          Presented by: Faizuddin Mughal (ENG25AD0168) · Kumar Navneet (ENG25AD0152) · Manoj Kumar KN (ENG25AD0160) · Jeevakash K (ENG25AD0133) · Bhavesh Reddy (ENG25AD0154) · Kishan (ENG25AD0144)
        </div>
      </footer>
    </div>
  );
}
