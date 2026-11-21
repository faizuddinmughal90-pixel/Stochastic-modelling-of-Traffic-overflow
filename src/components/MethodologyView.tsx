import React from 'react';

const SECTIONS = [
  { id: 'm-aim', num: '01', title: 'Aim and Problem' },
  { id: 'm-data', num: '02', title: 'Data & Cleaning' },
  { id: 'm-frame', num: '03', title: 'Framework Schedule' },
  { id: 'm-t1', num: '04', title: 'Poisson Distribution' },
  { id: 'm-t2', num: '05', title: 'Exponential Distribution' },
  { id: 'm-t3', num: '06', title: 'Markov Chain' },
  { id: 'm-t4', num: '07', title: 'Chi-Square Test' },
  { id: 'm-t5', num: '08', title: 'Normal & Demography' },
  { id: 'm-end', num: '09', title: 'Limitations & Conclusion' },
];

export const MethodologyView: React.FC = () => {
  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
      {/* Sticky editorial table of contents */}
      <nav
        aria-label="Methodology contents"
        className="border-b border-[var(--rule-hairline)] pb-4 lg:sticky lg:top-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"
      >
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          Monograph Sections
        </div>
        <ol className="flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-y-2.5">
          {SECTIONS.map((sec) => (
            <li key={sec.id}>
              <button
                type="button"
                onClick={() => jumpTo(sec.id)}
                className="group flex items-baseline gap-2.5 text-left text-sm text-[var(--ink-secondary)] transition-colors hover:text-[var(--accent-primary)] whitespace-nowrap"
              >
                <span className="font-mono-tabular text-xs text-[var(--ink-muted)] group-hover:text-[var(--accent-primary)]">
                  {sec.num}.
                </span>
                <span>{sec.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Main editorial monograph column */}
      <article className="max-w-[74ch] space-y-12 text-[15px] leading-relaxed text-[var(--ink-primary)]">
        {/* 01. Aim and Problem */}
        <section id="m-aim" className="scroll-mt-8 space-y-5">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 01</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">Aim and Problem</h2>
          </header>

          <div>
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">Aim</h3>
            <p className="mt-1 text-[var(--ink-secondary)]">
              To describe the traffic inflow into a particular area using probability models, test how well the models fit the real counts, and link the results to the demography of the area.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">Abstract</h3>
            <p className="mt-1 text-[var(--ink-secondary)]">
              This project plans a methodology for stochastic modelling of traffic inflow. Vehicles entering an area are counted in fixed time slots, split by vehicle type. The Poisson distribution models arrivals per slot, the Exponential distribution models the gaps between vehicles, and a Markov chain models shifts between light, moderate and heavy traffic. The Chi-square test checks the fit, with the Normal distribution as an extra. Results are compared across areas with different demography.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">Introduction</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[var(--ink-secondary)]">
              <li>
                Traffic never arrives at a steady beat: ten minutes may bring 32 vehicles, the next ten 47, and the next 38.
              </li>
              <li>
                Towns add vehicles faster than road, and mixed traffic of bikes, autos, cars, buses and trucks makes the pattern harder to read.
              </li>
              <li>
                Inflow, the number of vehicles entering an area in a given time, is the starting point for signal timing, road design, safety, parking, air quality and planning ahead.
              </li>
              <li>
                A stochastic model treats arrivals as a random process: unpredictable from one moment to the next, but with a clear pattern over time.
              </li>
              <li>
                Probability lets us describe inflow with numbers instead of hunches, including the risk of a bad slot and not just the typical one.
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-[var(--rule-hairline)] pt-5 sm:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">Problem statement</h3>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                Traffic inflow depends on the area: students, offices, markets and housing each produce different vehicles, peaks and quiet spells. A plain average such as “40 vehicles every ten minutes” hides the worst slot, the quiet gaps and whether heavy traffic lasts.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">Research gap</h3>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                There is a need to check whether simple probability models describe inflow in one particular demography, and to show where they fail, for example when signals or office timings bunch vehicles together.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">Proposed solution</h3>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                Count vehicles by type in fixed slots, model them with Poisson, Exponential and Markov chain, test the fit with Chi-square, and compare areas.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">Scope</h3>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                Only vehicles entering the area, in fixed 10-minute slots, with morning peak, midday, evening peak and night treated separately.
              </p>
            </div>
          </div>
        </section>

        {/* 02. Data */}
        <section id="m-data" className="scroll-mt-8 space-y-6">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 02</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">
              Data Description, Collection and Cleaning
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-secondary)]">
              Data source: counts at the main entry points (tally, video or automatic counters), plus census and municipal records.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">Traffic data (per time slot)</h3>
              <table className="booktabs-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Counts per slot</td>
                    <td>Vehicles entering per 10 minutes</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Gaps</td>
                    <td>Arrival time to the second</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Vehicle category</td>
                    <td>Two-wheeler, car, auto, bus, truck, cycle</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Date and time</td>
                    <td>Slot start, weekday or weekend</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Location</td>
                    <td>Entry point, direction, lanes, signals</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Conditions</td>
                    <td>Weather, festivals, roadworks, accidents</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">Demographic data (once per area)</h3>
              <table className="booktabs-table">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Population, density</td>
                    <td>More people, more trips</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Age groups</td>
                    <td>Students lean to two-wheelers</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Occupation</td>
                    <td>Offices and factories create timed surges</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Vehicle ownership</td>
                    <td>Shapes the vehicle mix</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Land use</td>
                    <td>Residential, market, office, school</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Travel patterns</td>
                    <td>Explain when peaks fall</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                Traffic data shows how the area behaves; demographic data, matched to it afterwards, shows why.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">Collection plan</h3>
              <table className="booktabs-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Where</td>
                    <td>Main entry points, away from signals</td>
                  </tr>
                  <tr>
                    <td className="font-medium">How long</td>
                    <td>3–5 days, including a weekend</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Slots</td>
                    <td>About 100 per period</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Slot length</td>
                    <td>10 minutes, same throughout</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Methods</td>
                    <td>Tally, video, counters, records</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Quality</td>
                    <td>Fixed classes, double counting, flag disturbed slots</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">Cleaning and dispersion check</h3>
              <p className="text-sm text-[var(--ink-secondary)]">
                Remove or flag missing slots, impossible values, duplicates and accident slots; log every change.
              </p>
              <div className="font-mono-tabular my-3 border border-[var(--rule-hairline)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm text-[var(--ink-primary)]">
                dispersion index = variance / mean
              </div>
              <table className="booktabs-table">
                <thead>
                  <tr>
                    <th>Value</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono-tabular">≈ 1</td>
                    <td>Poisson looks good</td>
                  </tr>
                  <tr>
                    <td className="font-mono-tabular">&gt; 1</td>
                    <td>Bunching, often from a signal</td>
                  </tr>
                  <tr>
                    <td className="font-mono-tabular">&lt; 1</td>
                    <td>More even than random</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 03. Framework */}
        <section id="m-frame" className="scroll-mt-8 space-y-4">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 03</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">Methodology Framework</h2>
          </header>

          <ol className="divide-y divide-[var(--rule-hairline)] border-b border-[var(--rule-hairline)]">
            {[
              ['01', 'Choose the area, entry points, vehicle classes and slot length.', 'Week 1'],
              ['02', 'Collect and clean the counts.', 'Weeks 2–4'],
              ['03', 'Run summaries and the dispersion check.', 'Week 4'],
              ['04', 'Fit Poisson to counts and Exponential to gaps.', 'Week 5'],
              ['05', 'Label slots light, moderate or heavy and build the Markov chain.', 'Week 5'],
              ['06', 'Run Chi-square tests and the Normal check.', 'Week 6'],
              ['07', 'Compare areas and relate them to demography.', 'Week 6'],
              ['08', 'Write up the findings and limitations.', 'Week 7'],
            ].map(([step, text, wk]) => (
              <li key={step} className="grid grid-cols-[36px_1fr_auto] items-baseline gap-4 py-3 text-sm">
                <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-primary)]">{step}</span>
                <span className="text-[var(--ink-primary)]">{text}</span>
                <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">{wk}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 04. Tool 1: Poisson */}
        <section id="m-t1" className="scroll-mt-8 space-y-4">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 04 · Statistical Tool 1</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">Poisson Distribution</h2>
          </header>

          <p className="text-[var(--ink-secondary)]">
            Models the number of vehicles arriving in a fixed time slot when arrivals are independent at a steady average rate λ.
          </p>

          <div className="font-mono-tabular border border-[var(--rule-hairline)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--ink-primary)]">
            P(X = x) = e<sup>−λ</sup> · λ<sup>x</sup> / x!
          </div>
          <p className="text-xs text-[var(--ink-muted)]">Where x = number of vehicles, λ = average count per slot.</p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">It fits when</h3>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                Arrivals are independent · the rate is steady within the period · no two vehicles arrive at the same instant · mean ≈ variance.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">Basic probability</h3>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                P(event) = slots where it happened / total slots. More than 20 bikes in 18 of 120 slots gives 18/120 = 0.15, about one slot in seven.
              </p>
            </div>
          </div>

          <div className="max-w-sm pt-2">
            <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">
              Worked example: λ = 40 per 10 minutes
            </h3>
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th className="num">Probability</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Exactly 40</td>
                  <td className="num">0.063</td>
                </tr>
                <tr>
                  <td>Exactly 35</td>
                  <td className="num">0.049</td>
                </tr>
                <tr>
                  <td>Exactly 45</td>
                  <td className="num">0.044</td>
                </tr>
                <tr>
                  <td>35 or fewer</td>
                  <td className="num">0.24</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              About a quarter of slots are that quiet or quieter. A separate λ is fitted for each vehicle type.
            </p>
          </div>
        </section>

        {/* 05. Tool 2: Exponential */}
        <section id="m-t2" className="scroll-mt-8 space-y-4">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 05 · Statistical Tool 2</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">Exponential Distribution</h2>
          </header>

          <p className="text-[var(--ink-secondary)]">
            Models the waiting time between two vehicles. If arrivals are Poisson, the gaps are exponential, so the two models back each other up.
          </p>

          <div className="font-mono-tabular border border-[var(--rule-hairline)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--ink-primary)]">
            P(gap &gt; t) = e<sup>−r·t</sup>
            <br />
            mean gap = 1 / r
          </div>
          <p className="text-xs text-[var(--ink-muted)]">Where r = arrival rate per second, t = gap in seconds.</p>

          <div>
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">How we check it</h3>
            <p className="mt-1 text-sm text-[var(--ink-secondary)]">
              Standard deviation of gaps should be close to the mean · overlay the exponential curve on a histogram of gaps · Chi-square or Kolmogorov-Smirnov test · short gaps point to crowding and tailgating.
            </p>
          </div>

          <div className="max-w-sm pt-2">
            <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">
              Worked example: 40 vehicles per 10 minutes
            </h3>
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th className="num">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rate r</td>
                  <td className="num">0.067 per second</td>
                </tr>
                <tr>
                  <td>Average gap</td>
                  <td className="num">15 seconds</td>
                </tr>
                <tr>
                  <td>Gap over 30 s</td>
                  <td className="num">0.135</td>
                </tr>
                <tr>
                  <td>Gap under 5 s</td>
                  <td className="num">0.28</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              A gap over 30 s occurs about once in seven. Short gaps are why random traffic still looks clustered.
            </p>
          </div>
        </section>

        {/* 06. Tool 3: Markov */}
        <section id="m-t3" className="scroll-mt-8 space-y-4">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 06 · Statistical Tool 3</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">Markov Chain</h2>
          </header>

          <p className="text-[var(--ink-secondary)]">
            Adds a bit of memory: the next state of traffic depends on the state now. Traffic tends to stay in one state for a while.
          </p>

          <div>
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">Building the chain</h3>
            <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm text-[var(--ink-secondary)]">
              <li>Define states: light, moderate, heavy, from low, middle and high count bands.</li>
              <li>Count the moves between consecutive slots.</li>
              <li>Divide each row by its total to get probabilities.</li>
            </ol>
          </div>

          <div className="font-mono-tabular border border-[var(--rule-hairline)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--ink-primary)]">
            p(ij) = P(next state = j | current state = i)
          </div>
          <p className="text-xs text-[var(--ink-muted)]">
            Needs a few hundred slots, and the band limits must be stated clearly because they change the results.
          </p>

          <div className="max-w-md pt-2">
            <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">
              Transition table (illustrative numbers)
            </h3>
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>From / To</th>
                  <th className="num">Light</th>
                  <th className="num">Moderate</th>
                  <th className="num">Heavy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Light</td>
                  <td className="num">0.60</td>
                  <td className="num">0.30</td>
                  <td className="num">0.10</td>
                </tr>
                <tr>
                  <td>Moderate</td>
                  <td className="num">0.25</td>
                  <td className="num">0.50</td>
                  <td className="num">0.25</td>
                </tr>
                <tr>
                  <td>Heavy</td>
                  <td className="num">0.10</td>
                  <td className="num">0.40</td>
                  <td className="num">0.50</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Light now: 60% stays light. Two slots ahead, the chance of heavy is about 0.185. Long-run share of time: about 32% light, 41% moderate, 27% heavy.
            </p>
          </div>
        </section>

        {/* 07. Tool 4: Chi-square */}
        <section id="m-t4" className="scroll-mt-8 space-y-4">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 07 · Statistical Tool 4</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">Chi-Square Test</h2>
          </header>

          <p className="text-[var(--ink-secondary)]">Checks whether the observed counts fit what the model expects.</p>
          <p className="text-sm text-[var(--ink-primary)]">
            H₀: counts follow a Poisson distribution.
            <br />
            H₁: counts do not follow a Poisson distribution.
          </p>

          <div className="font-mono-tabular border border-[var(--rule-hairline)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--ink-primary)]">
            χ² = Σ (O − E)² / E
          </div>
          <p className="text-xs text-[var(--ink-muted)]">
            Where O = observed slots, E = expected slots = N × Poisson probability. Merge rare counts until every E is at least 5. Degrees of freedom = classes − 1 − 1. Significance level: 0.05.
          </p>

          <div className="max-w-md pt-2">
            <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">
              Example: 100 five-minute slots, λ = 4
            </h3>
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
                <tr>
                  <td>0 or 1</td>
                  <td className="num">6</td>
                  <td className="num">9.2</td>
                  <td className="num">1.09</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td className="num">18</td>
                  <td className="num">14.7</td>
                  <td className="num">0.76</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td className="num">24</td>
                  <td className="num">19.5</td>
                  <td className="num">1.02</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td className="num">15</td>
                  <td className="num">19.5</td>
                  <td className="num">1.05</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td className="num">20</td>
                  <td className="num">15.6</td>
                  <td className="num">1.22</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td className="num">7</td>
                  <td className="num">10.4</td>
                  <td className="num">1.12</td>
                </tr>
                <tr>
                  <td>7 or more</td>
                  <td className="num">10</td>
                  <td className="num">11.1</td>
                  <td className="num">0.10</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="num">100</td>
                  <td className="num">100</td>
                  <td className="num">6.37</td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-2.5 text-sm text-[var(--ink-primary)]">
              <strong>Result:</strong> χ² = 6.37, 5 d.f., critical value 11.07, p ≈ 0.27. Not significant: Poisson is not rejected.
            </p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Counts are invented for illustration.</p>
          </div>
        </section>

        {/* 08. Tool 5: Normal & Demography */}
        <section id="m-t5" className="scroll-mt-8 space-y-4">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 08 · Statistical Tool 5</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">
              Normal Distribution and Demography
            </h2>
          </header>

          <p className="text-[var(--ink-secondary)]">
            Extra check for busy periods: do counts look like a bell curve? Use a histogram, a Q-Q plot and the Shapiro-Wilk test.
          </p>

          <div className="font-mono-tabular border border-[var(--rule-hairline)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--ink-primary)]">
            Z = (X − μ) / σ
          </div>

          <p className="text-sm text-[var(--ink-secondary)]">
            Example: μ = 40, σ ≈ 6.3. More than 50 vehicles uses cutoff 50.5, so Z ≈ 1.66 and the probability is about 0.048, very close to Poisson. Use it when the average is above about 20 per slot; for buses and trucks, stay with Poisson.
          </p>

          <div className="pt-2">
            <h3 className="mb-2 text-base font-semibold text-[var(--ink-primary)]">Compare contrasting areas</h3>
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>If the area has</th>
                  <th>We would expect</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Many students</td>
                  <td>More two-wheelers; peaks at college timings</td>
                </tr>
                <tr>
                  <td className="font-medium">Many offices</td>
                  <td>Sharp, short morning and evening peaks</td>
                </tr>
                <tr>
                  <td className="font-medium">A busy market</td>
                  <td>Short gaps, goods vehicles, long heavy spells</td>
                </tr>
                <tr>
                  <td className="font-medium">Mostly housing</td>
                  <td>Low, steady inflow, small peaks</td>
                </tr>
                <tr>
                  <td className="font-medium">High car ownership</td>
                  <td>More cars, larger counts</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Compare λ, vehicle mix, Markov tables and gaps. These are expectations to test, not conclusions.
            </p>
          </div>
        </section>

        {/* 09. Limitations & Conclusion */}
        <section id="m-end" className="scroll-mt-8 space-y-6">
          <header className="border-b border-[var(--rule-hairline)] pb-3">
            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Section 09</span>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">
              Limitations, Future Scope and Conclusion
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">Limitations</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--ink-secondary)]">
                <li>Poisson assumes independent, steady arrivals; signals and school or office timings can bunch vehicles.</li>
                <li>Exponential and Markov models need exact arrival times and a long run of slots.</li>
                <li>Light, moderate and heavy limits change the Markov results.</li>
                <li>Results belong to the place and time surveyed; mixed traffic is modelled by vehicle type.</li>
                <li>Demographic data may come from older census years.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">Future scope</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--ink-secondary)]">
                <li>Poisson regression linking arrival rate to density and vehicle ownership.</li>
                <li>Time-varying Poisson process and queueing models for waiting time at the entry point.</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--rule-hairline)] pt-5">
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">Conclusion</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--ink-secondary)]">
              <li>Basic probability gives the first honest answers: how often busy slots happen and the share of each vehicle type.</li>
              <li>Poisson models counts per slot; Exponential models gaps between vehicles.</li>
              <li>The Markov chain shows how traffic moves between light, moderate and heavy.</li>
              <li>Chi-square checks whether the models really fit; Normal is a shortcut for busy periods.</li>
              <li>A bad fit is also a finding: it points to bunching or a changing rate.</li>
              <li>
                A handful of simple models, checked against real counts, turn vehicle counts into clear, honest statements about an area’s traffic.
              </li>
            </ul>
          </div>
        </section>
      </article>
    </div>
  );
};
