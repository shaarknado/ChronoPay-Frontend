import DesignChecklist from "@/components/design/DesignChecklist";
import { StatusMatrix, statusMatrixData } from "@/components/design/status-matrix";
import Link from "next/link";
import { Suspense } from "react";
import { SentimentChipFilter } from "@/components/dashboard/sentiment-chip-filter";
import { SentimentSparkline } from "@/components/dashboard/sentiment-sparkline";
import {
  reviewSentimentCounts,
  reviewSentimentTrend,
} from "@/components/dashboard/dashboard-data";

export default function DesignReviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-slate-900">
              C
            </div>
            <span className="font-semibold tracking-tight">Design System</span>
          </div>
          <Link
            href="/"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Design Review Guide
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Every feature in ChronoPay must meet our high bar for accessibility,
            responsiveness, and operational reliability. Use this guide to audit
            your work before submitting a PR.
          </p>
        </section>

        <section className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Live Checklist
              </h2>
              <DesignChecklist />
            </div>

            {/* ── Sentiment Chip Filter showcase ── */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Sentiment Chip Filter
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl">
                Chip row with counts + sparkline trend. Active bucket syncs to
                the <code className="text-cyan-300 font-mono text-xs">?sentiment=</code> search
                param. WCAG 2.1 AA: <code className="text-cyan-300 font-mono text-xs">role=&quot;group&quot;</code>,
                {" "}<code className="text-cyan-300 font-mono text-xs">aria-pressed</code>, polite live
                region on change, arrow-key navigation, focus-ring-cyan.
              </p>

              {/* Dark surface swatch */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Dark surface
                </p>
                <Suspense fallback={null}>
                  <SentimentChipFilter
                    counts={reviewSentimentCounts}
                    trendData={reviewSentimentTrend}
                    paramKey="dr-sentiment"
                  />
                </Suspense>
              </div>

              {/* Light surface swatch */}
              <div
                data-theme="light"
                className="rounded-2xl border border-black/10 bg-white/90 p-5 space-y-4"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Light surface
                </p>
                <Suspense fallback={null}>
                  <SentimentChipFilter
                    counts={reviewSentimentCounts}
                    trendData={reviewSentimentTrend}
                    paramKey="dr-sentiment-light"
                  />
                </Suspense>
              </div>

              {/* Empty / low-signal state */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Low-signal state (all zeros, no trend)
                </p>
                <Suspense fallback={null}>
                  <SentimentChipFilter
                    counts={{ positive: 0, mixed: 0, critical: 0 }}
                    trendData={[]}
                    paramKey="dr-sentiment-empty"
                  />
                </Suspense>
              </div>

              {/* Standalone sparkline showcase */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Sparkline — standalone
                </p>
                <div className="flex flex-wrap gap-8 items-end">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">8-week trend</p>
                    <SentimentSparkline
                      data={reviewSentimentTrend}
                      width={120}
                      height={36}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Single data point</p>
                    <SentimentSparkline
                      data={[{ period: "2026-07-20", positive: 48, mixed: 17, critical: 9 }]}
                      width={88}
                      height={28}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">No data (empty state)</p>
                    <SentimentSparkline data={[]} width={88} height={28} />
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/design-review/focus-trap"
              className="block"
            >
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 hover:bg-cyan-500/10 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                    <span className="text-lg font-bold">T</span>
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Focus Trap Tester</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automated tab-cycle verification for every modal and overlay
                    </p>
                  </div>
                  <span className="ml-auto text-xs font-medium text-cyan-400">
                    Test →
                  </span>
                </div>
              </div>
            </Link>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Operationalizing Quality
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                <div className="p-5 rounded-xl border border-white/5 bg-white/5 space-y-2">
                  <h3 className="font-medium text-slate-200">PR Template</h3>
                  <p>
                    All contributors should use the standard PR template which
                    includes a subset of this checklist for rapid verification.
                  </p>
                </div>
                <div className="p-5 rounded-xl border border-white/5 bg-white/5 space-y-2">
                  <h3 className="font-medium text-slate-200">Accessibility First</h3>
                  <p>
                    We aim for WCAG 2.1 AA. If you&apos;re unsure about ARIA roles or
                    keyboard patterns, reference the README or ask for a review.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                System Status Matrix
              </h2>
              <StatusMatrix config={statusMatrixData} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
