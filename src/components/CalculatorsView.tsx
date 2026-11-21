import React, { useState } from 'react';
import {
  fmt,
  matMul3,
  mean,
  normalCdf,
  parseNumericList,
  poissonCdf,
  poissonPmf,
  STATE_NAMES,
  stationaryDistribution,
  variance,
} from '../lib/statistics';

interface CalculatorsViewProps {
  activeCountsText: string;
}

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({ activeCountsText }) => {
  // 1. Poisson
  const [cL, setCL] = useState('40');
  const [cX, setCX] = useState('35');

  // 2. Exponential
  const [eL, setEL] = useState('40');
  const [eM, setEM] = useState('10');
  const [eT, setET] = useState('30');
  const [eS, setES] = useState('5');

  // 3. Basic probability
  const [bE, setBE] = useState('18');
  const [bN, setBN] = useState('120');

  // 4. Normal approximation
  const [nM, setNM] = useState('40');
  const [nS, setNS] = useState('6.32');
  const [nX, setNX] = useState('50');

  // 5. Markov table
  const [mk, setMk] = useState<number[][]>([
    [0.6, 0.3, 0.1],
    [0.25, 0.5, 0.25],
    [0.1, 0.4, 0.5],
  ]);

  const lVal = Number(cL);
  const xVal = Math.round(Number(cX));
  const poisValid = Number.isFinite(lVal) && lVal > 0 && Number.isFinite(xVal) && xVal >= 0;

  const elVal = Number(eL);
  const emVal = Number(eM);
  const etVal = Number(eT);
  const esVal = Number(eS);
  const expRate = elVal > 0 && emVal > 0 ? elVal / (emVal * 60) : NaN;

  const beVal = Number(bE);
  const bnVal = Number(bN);
  const basicValid = Number.isFinite(bnVal) && bnVal > 0 && Number.isFinite(beVal) && beVal >= 0 && beVal <= bnVal;

  const muVal = Number(nM);
  const sigVal = Number(nS);
  const nxVal = Number(nX);
  const normValid = Number.isFinite(sigVal) && sigVal > 0 && Number.isFinite(muVal) && Number.isFinite(nxVal);
  const zVal = normValid ? (nxVal + 0.5 - muVal) / sigVal : NaN;

  const parsedActive = parseNumericList(activeCountsText, 'count');
  const canPullFromData = !parsedActive.error && parsedActive.values.length > 2;

  const pullFromWorkbench = () => {
    if (!canPullFromData) return;
    const m = mean(parsedActive.values);
    const sd = Math.sqrt(variance(parsedActive.values));
    setNM(fmt(m, 2));
    setNS(fmt(sd, 2));
    setNX(String(Math.round(m + sd * 1.6)));
  };

  const badRowIdx = mk.findIndex(
    (r) => Math.abs(r[0] + r[1] + r[2] - 1) > 0.011 || r.some((v) => !Number.isFinite(v) || v < 0)
  );
  const mkP2 = badRowIdx < 0 ? matMul3(mk, mk) : null;
  const mkStat = badRowIdx < 0 ? stationaryDistribution(mk) : null;

  const updateMkCell = (i: number, j: number, val: string) => {
    const next = mk.map((row) => [...row]);
    next[i][j] = Number(val);
    setMk(next);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--rule-hairline)] pb-4">
        <span className="text-xs font-medium text-[var(--ink-muted)]">Interactive Worked Examples</span>
        <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">
          Distribution &amp; Transition Calculators
        </h2>
        <p className="mt-1 max-w-[70ch] text-sm text-[var(--ink-secondary)]">
          Each calculator initializes with the worked parameters from the study presentation. Adjust any input to explore sensitivity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 1. Poisson */}
        <section className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-5">
          <h3 className="text-lg font-semibold text-[var(--ink-primary)]">Poisson Probabilities</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="calc-cL" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                λ per slot
              </label>
              <input
                id="calc-cL"
                type="number"
                step="any"
                value={cL}
                onChange={(e) => setCL(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label htmlFor="calc-cX" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                x vehicles
              </label>
              <input
                id="calc-cX"
                type="number"
                step={1}
                value={cX}
                onChange={(e) => setCX(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="mt-4">
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th className="num">Probability</th>
                </tr>
              </thead>
              <tbody>
                {poisValid ? (
                  <>
                    <tr>
                      <td>Exactly {xVal}</td>
                      <td className="num">{fmt(poissonPmf(lVal, xVal), 3)}</td>
                    </tr>
                    <tr>
                      <td>{xVal} or fewer</td>
                      <td className="num">{fmt(poissonCdf(lVal, xVal), 3)}</td>
                    </tr>
                    <tr>
                      <td>More than {xVal}</td>
                      <td className="num">{fmt(1 - poissonCdf(lVal, xVal), 3)}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={2} className="text-[var(--ink-muted)]">
                      Enter λ &gt; 0 and x ≥ 0.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. Exponential */}
        <section className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-5">
          <h3 className="text-lg font-semibold text-[var(--ink-primary)]">Exponential Headways</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="calc-eL" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                Vehicles/slot
              </label>
              <input
                id="calc-eL"
                type="number"
                step="any"
                value={eL}
                onChange={(e) => setEL(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label htmlFor="calc-eM" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                Slot min
              </label>
              <input
                id="calc-eM"
                type="number"
                step="any"
                value={eM}
                onChange={(e) => setEM(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label htmlFor="calc-eT" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                Gap over (s)
              </label>
              <input
                id="calc-eT"
                type="number"
                step="any"
                value={eT}
                onChange={(e) => setET(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label htmlFor="calc-eS" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                Gap under (s)
              </label>
              <input
                id="calc-eS"
                type="number"
                step="any"
                value={eS}
                onChange={(e) => setES(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="mt-4">
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th className="num">Value</th>
                </tr>
              </thead>
              <tbody>
                {Number.isFinite(expRate) && expRate > 0 ? (
                  <>
                    <tr>
                      <td>Arrival rate r</td>
                      <td className="num">{fmt(expRate, 3)} /s</td>
                    </tr>
                    <tr>
                      <td>Average gap (1 / r)</td>
                      <td className="num">{fmt(1 / expRate, 1)} s</td>
                    </tr>
                    <tr>
                      <td>P(gap &gt; {etVal} s)</td>
                      <td className="num">{fmt(Math.exp(-expRate * etVal), 3)}</td>
                    </tr>
                    <tr>
                      <td>P(gap &lt; {esVal} s)</td>
                      <td className="num">{fmt(1 - Math.exp(-expRate * esVal), 3)}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={2} className="text-[var(--ink-muted)]">
                      Enter positive vehicle count and slot duration.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Basic probability */}
        <section className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-5">
          <h3 className="text-lg font-semibold text-[var(--ink-primary)]">Empirical Slot Probability</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="calc-bE" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                Event slots
              </label>
              <input
                id="calc-bE"
                type="number"
                step={1}
                value={bE}
                onChange={(e) => setBE(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label htmlFor="calc-bN" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                Total slots
              </label>
              <input
                id="calc-bN"
                type="number"
                step={1}
                value={bN}
                onChange={(e) => setBN(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="mt-4">
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>Measure</th>
                  <th className="num">Result</th>
                </tr>
              </thead>
              <tbody>
                {basicValid ? (
                  <>
                    <tr>
                      <td>Empirical probability P(event)</td>
                      <td className="num">{fmt(beVal / bnVal, 3)}</td>
                    </tr>
                    <tr>
                      <td>Expected recurrence</td>
                      <td className="num">
                        {beVal > 0 ? `1 in ${fmt(bnVal / beVal, 1)} slots` : 'Never observed'}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={2} className="text-[var(--ink-muted)]">
                      Enter event slots between 0 and total slots.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="mt-2.5 text-xs text-[var(--ink-muted)]">
              Worked example: more than 20 two-wheelers recorded in 18 of 120 survey slots.
            </p>
          </div>
        </section>

        {/* 4. Normal approximation */}
        <section className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--ink-primary)]">Normal Approximation</h3>
            <button
              type="button"
              disabled={!canPullFromData}
              onClick={pullFromWorkbench}
              className="border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              Use workbench data
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="calc-nM" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                Mean μ
              </label>
              <input
                id="calc-nM"
                type="number"
                step="any"
                value={nM}
                onChange={(e) => setNM(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label htmlFor="calc-nS" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                Std dev σ
              </label>
              <input
                id="calc-nS"
                type="number"
                step="any"
                value={nS}
                onChange={(e) => setNS(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
            <div>
              <label htmlFor="calc-nX" className="mb-1 block text-xs font-semibold text-[var(--ink-secondary)]">
                More than
              </label>
              <input
                id="calc-nX"
                type="number"
                step={1}
                value={nX}
                onChange={(e) => setNX(e.target.value)}
                className="font-mono-tabular w-full border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-sm text-[var(--ink-primary)]"
              />
            </div>
          </div>

          <div className="mt-4">
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th className="num">Value</th>
                </tr>
              </thead>
              <tbody>
                {normValid ? (
                  <>
                    <tr>
                      <td>Continuity-corrected cutoff</td>
                      <td className="num">{fmt(nxVal + 0.5, 1)}</td>
                    </tr>
                    <tr>
                      <td>Z = (X − μ) / σ</td>
                      <td className="num">{fmt(zVal, 2)}</td>
                    </tr>
                    <tr>
                      <td>Normal P(X &gt; {nxVal})</td>
                      <td className="num">{fmt(1 - normalCdf(zVal), 3)}</td>
                    </tr>
                    <tr>
                      <td>Exact Poisson (same mean)</td>
                      <td className="num">
                        {muVal > 0 ? fmt(1 - poissonCdf(muVal, Math.floor(nxVal)), 3) : '–'}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={2} className="text-[var(--ink-muted)]">
                      Enter σ &gt; 0.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Interactive Markov transition matrix */}
        <section className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-5 md:col-span-2">
          <h3 className="text-lg font-semibold text-[var(--ink-primary)]">
            Markov Chain — Editable Presentation Table
          </h3>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Each row must sum to 1.00. Edit any transition probability to observe two-step forecasts and long-run equilibrium shifts.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div className="overflow-x-auto">
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
                  {mk.map((row, i) => (
                    <tr key={STATE_NAMES[i]}>
                      <td className="font-medium">{STATE_NAMES[i]}</td>
                      {row.map((val, j) => (
                        <td key={j} className="num">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            aria-label={`${STATE_NAMES[i]} to ${STATE_NAMES[j]}`}
                            value={val}
                            onChange={(e) => updateMkCell(i, j, e.target.value)}
                            className="font-mono-tabular w-20 border border-[var(--rule-hairline)] bg-[var(--bg-canvas)] px-2 py-1 text-right text-sm text-[var(--ink-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[var(--rule-hairline)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {badRowIdx >= 0 ? (
                <p role="alert" className="text-sm font-medium text-[var(--status-bad)]">
                  The {STATE_NAMES[badRowIdx]} row must sum to 1.00 (currently{' '}
                  {fmt(mk[badRowIdx][0] + mk[badRowIdx][1] + mk[badRowIdx][2], 2)}).
                </p>
              ) : (
                mkP2 &&
                mkStat && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                        Two slots ahead (from Light)
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink-primary)]">
                        Probability of reaching Heavy traffic two slots later:{' '}
                        <strong className="font-mono-tabular text-base">{fmt(mkP2[0][2], 3)}</strong>
                      </p>
                    </div>
                    <div className="border-t border-[var(--rule-hairline)] pt-3">
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                        Stationary long-run share
                      </div>
                      <div className="font-mono-tabular mt-1.5 flex flex-wrap gap-4 text-sm font-semibold text-[var(--ink-primary)]">
                        {STATE_NAMES.map((name, idx) => (
                          <span key={name}>
                            {name}: {Math.round(mkStat[idx] * 100)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
