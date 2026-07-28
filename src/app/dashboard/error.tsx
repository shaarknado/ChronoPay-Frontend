"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DashboardShell } from "../components/dashboard-shell";
import { EmptyStateIllustration } from "../components/empty-state-illustration";

export default function DashboardError({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell>
      <section
        role="alert"
        className="glass-panel mx-auto max-w-2xl rounded-[2rem] p-6 sm:p-8"
        aria-labelledby="dashboard-error-title"
        aria-describedby="dashboard-error-description"
      >
        <EmptyStateIllustration accentLabel="Error" />
        <h1
          id="dashboard-error-title"
          className="mt-4 text-3xl font-semibold tracking-tight text-white"
        >
          Oops! Something went wrong.
        </h1>
        <p
          id="dashboard-error-description"
          className="mt-4 text-sm leading-7 text-slate-300"
        >
          We couldn&apos;t load your dashboard. This might be a temporary network glitch.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-200"
          >
            Try again
          </button>
          <Link
            href="/status"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-cyan-200/30 hover:bg-white/10"
          >
            View status page
          </Link>
          <Link
            href="mailto:support@chronopay.com"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-rose-200/30 hover:bg-white/10"
          >
            Contact support
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
