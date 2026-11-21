import React from 'react';

export const ReferencesView: React.FC = () => {
  return (
    <div className="max-w-[74ch] space-y-8">
      <header className="border-b border-[var(--rule-hairline)] pb-3">
        <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">Source Audit</span>
        <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-primary)]">References</h2>
      </header>

      <div className="border border-[var(--rule-hairline)] bg-[var(--bg-plate)] p-6">
        <p className="text-base leading-relaxed text-[var(--ink-primary)]">
          <strong>The presentation contains no references.</strong> There is no references slide and no citation on any of its 14 slides, so none are listed here. Adding sources that the deck does not name would mean inventing them.
        </p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          When the group compiles its bibliographic sources, they can be recorded in this section exactly as cited.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--ink-primary)]">What the presentation deck does name</h3>
        <div className="grid grid-cols-1 gap-6 border-t border-[var(--rule-hairline)] pt-4 sm:grid-cols-2">
          <div>
            <div className="font-mono-tabular text-xs text-[var(--ink-muted)]">Slide 5</div>
            <h4 className="mt-0.5 text-base font-semibold text-[var(--ink-primary)]">Data sources</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-secondary)]">
              Counts at the main entry points (tally, video or automatic counters), plus census and municipal records. No specific datasets, agencies or years are given.
            </p>
          </div>
          <div>
            <div className="font-mono-tabular text-xs text-[var(--ink-muted)]">Slides 8–12</div>
            <h4 className="mt-0.5 text-base font-semibold text-[var(--ink-primary)]">Statistical methods</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-secondary)]">
              Poisson distribution, Exponential distribution, Markov chain, Chi-square test, Normal distribution, Kolmogorov-Smirnov test, Shapiro-Wilk test and Q-Q plots. These are method names only, with no textbook or paper attached.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
