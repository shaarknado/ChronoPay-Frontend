"use client";

import { useState, useCallback, useRef, useEffect, useId } from "react";
import { FocusTrap } from "@/components/common/FocusTrap";
import { LiveRegion } from "@/components/common/LiveRegion";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TestResult {
  tabForward: boolean | null;
  tabBackward: boolean | null;
  focusOnMount: boolean | null;
  offendingElement: string | null;
  error: string | null;
  focusableCount: number;
}

export interface OverlayCase {
  id: string;
  name: string;
  description: string;
  sourcePath: string;
  hasFocusTrap: boolean;
  focusTrapType: "FocusTrap component" | "Inline trap" | "None";
  note?: string;
}

interface OverlayCaseProps {
  overlay: OverlayCase;
  renderModal: (onClose: () => void) => React.ReactNode;
  onTestComplete: (id: string, result: TestResult) => void;
  onTestStart: (id: string) => void;
}

// ── Focusable element query ─────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null,
  );
}

// ── Automated test runner ──────────────────────────────────────────────────────

async function runTabCycleTest(container: HTMLElement): Promise<TestResult> {
  const focusable = getFocusable(container);

  if (focusable.length === 0) {
    return {
      tabForward: null,
      tabBackward: null,
      focusOnMount: false,
      offendingElement: null,
      error: "No focusable elements found in the trap",
      focusableCount: 0,
    };
  }

  if (focusable.length < 2) {
    return {
      tabForward: null,
      tabBackward: null,
      focusOnMount: container.contains(document.activeElement),
      offendingElement: null,
      error: "Need at least 2 focusable elements to test tab cycling",
      focusableCount: 1,
    };
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const firstLabel =
    first.tagName.toLowerCase() +
    (first.textContent ? ` "${first.textContent.trim().slice(0, 48)}"` : "");
  const lastLabel =
    last.tagName.toLowerCase() +
    (last.textContent ? ` "${last.textContent.trim().slice(0, 48)}"` : "");

  // Check focus is within the trap on mount
  const focusOnMount = container.contains(document.activeElement);

  // ── Test 1: Tab forward (last element → should wrap to first) ──
  last.focus();
  await tick();
  last.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: false,
      bubbles: true,
      cancelable: true,
    }),
  );
  await tick();
  const tabForward = document.activeElement === first;

  // ── Test 2: Shift+Tab backward (first element → should wrap to last) ──
  first.focus();
  await tick();
  first.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  await tick();
  const tabBackward = document.activeElement === last;

  // Identify the first offending element
  let offendingElement: string | null = null;
  if (!tabForward) {
    offendingElement = lastLabel;
  } else if (!tabBackward) {
    offendingElement = firstLabel;
  }

  return {
    tabForward,
    tabBackward,
    focusOnMount,
    offendingElement,
    error: null,
    focusableCount: focusable.length,
  };
}

function tick(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

// ── Test case modals ──────────────────────────────────────────────────────────

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-semibold text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ×
              </span>
            </button>
          </div>
          {children}
        </div>
      </FocusTrap>
    </div>
  );
}

function WalletConnectTestModal({ onClose }: { onClose: () => void }) {
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  return (
    <ModalShell title="Choose how to connect" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">Pick a path that fits your workflow.</p>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by capabilities">
        {["Smart contracts", "NFTs", "DeFi"].map((cap) => (
          <button
            key={cap}
            type="button"
            aria-pressed={pressed[cap] ?? false}
            onClick={() => setPressed((p) => ({ ...p, [cap]: !p[cap] }))}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {cap}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {[
          { id: "freighter", name: "Freighter", recommended: true },
          { id: "albedo", name: "Albedo" },
          { id: "lobstr", name: "Lobstr" },
        ].map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-slate-700 p-3"
          >
            <div>
              <span className="text-sm font-medium text-white">{p.name}</span>
              {p.recommended && (
                <span className="ml-2 rounded bg-cyan-900/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Recommended
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label={`Connect to ${p.name}`}
              className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Connect
            </button>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function RefundConfirmTestModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Confirm refund destination" onClose={onClose}>
      <div className="mb-4 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4">
        <p className="text-sm font-semibold text-white">Original payment method</p>
        <span className="mt-1 inline-flex items-center rounded-full bg-cyan-300/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
          Recommended
        </span>
      </div>
      <div className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <p className="text-xs font-semibold text-slate-400">Refund details</p>
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Estimated arrival</span>
          <span className="font-medium text-white">2-3 business days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Fees</span>
          <span className="font-medium text-white">No fee</span>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Confirm refund
        </button>
      </div>
    </ModalShell>
  );
}

function CalendarSyncTestModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string>("merge");
  return (
    <ModalShell title="Sync conflicts" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        One event has conflicting changes between local and remote calendars.
      </p>
      <div className="mb-4 rounded-xl border border-white/6 bg-white/4 p-4">
        <p className="mb-3 text-sm font-semibold text-white">Team standup</p>
        <div role="radiogroup" aria-label="Resolution for Team standup" className="flex flex-wrap gap-2">
          {[
            { value: "useLocal", label: "Use local" },
            { value: "useRemote", label: "Use remote" },
            { value: "merge", label: "Merge" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                selected === opt.value
                  ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                  : "border-white/6 bg-white/4 text-slate-300 hover:border-white/16"
              }`}
            >
              <input
                type="radio"
                name="resolution"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/6 pt-4">
        <span className="text-xs text-slate-400">All conflicts have a resolution selected.</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Resolve
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ReceiptTestModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <ModalShell title="Transaction Receipt" onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-300/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          onClick={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Link copied" : "Copy share link"}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Print / Save PDF
        </button>
      </div>
      <div className="mb-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
          Optional tip for the supplier
        </p>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          {[1, 2.5, 5].map((amount) => (
            <button
              key={amount}
              type="button"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-300/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {amount.toFixed(2)} XLM
            </button>
          ))}
        </div>
        <div>
          <label className="sr-only" htmlFor="tip-amount">
            Custom tip amount in XLM
          </label>
          <input
            id="tip-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-lg font-semibold text-white outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300"
          />
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total</span>
          <span className="font-semibold text-white">0.00 XLM</span>
        </div>
      </div>
    </ModalShell>
  );
}

function OnboardingTestModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ["Welcome", "Connect wallet", "First booking"];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={steps[step]}
        className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            const focusable = Array.from(
              (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
            ).filter((el) => el.offsetParent !== null);
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
              if (document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              }
            } else {
              if (document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }
          }
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{steps[step]}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close walkthrough"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>
        <p className="mb-6 text-sm text-slate-400">
          {step === 0 && "Learn the basics of ChronoPay in a few steps."}
          {step === 1 && "Connect your Stellar wallet to get started."}
          {step === 2 && "Browse available slots and make your first booking."}
        </p>
        <div className="mb-4 flex justify-center gap-2" role="tablist" aria-label="Steps">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={i === step}
              aria-label={`Step ${i + 1}: ${s}`}
              onClick={() => setStep(i)}
              className={`h-2 w-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                i === step ? "bg-cyan-300" : "bg-slate-600"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (step < steps.length - 1 ? setStep(step + 1) : onClose())}
            className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {step < steps.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SimpleFocusTrapTestModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="FocusTrap — Simple test" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        A minimal FocusTrap with buttons, inputs, and a link.
      </p>
      <div className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="Text input"
          className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300"
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Primary
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Secondary
          </button>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-cyan-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Link
          </a>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Overlay definitions ──────────────────────────────────────────────────────

interface OverlayEntry {
  overlay: OverlayCase;
  renderModal: (onClose: () => void) => React.ReactNode;
}

const overlayEntries: OverlayEntry[] = [
  {
    overlay: {
      id: "focus-trap-base",
      name: "FocusTrap (Base)",
      description:
        "Core FocusTrap component with a mix of buttons, inputs, and links. Validates the component itself.",
      sourcePath: "src/components/common/FocusTrap.tsx",
      hasFocusTrap: true,
      focusTrapType: "FocusTrap component",
    },
    renderModal: (onClose) => <SimpleFocusTrapTestModal onClose={onClose} />,
  },
  {
    overlay: {
      id: "wallet-connect",
      name: "WalletConnectModal",
      description: "Connection method picker with wallet provider list, capability filter chips, and action buttons.",
      sourcePath: "src/components/dashboard/WalletConnectModal.tsx",
      hasFocusTrap: true,
      focusTrapType: "FocusTrap component",
    },
    renderModal: (onClose) => <WalletConnectTestModal onClose={onClose} />,
  },
  {
    overlay: {
      id: "refund-confirm",
      name: "RefundConfirmationModal",
      description: "Confirmation dialog for refund destination with tradeoff details and confirm/cancel actions.",
      sourcePath: "src/components/dashboard/refund-confirmation-modal.tsx",
      hasFocusTrap: true,
      focusTrapType: "FocusTrap component",
    },
    renderModal: (onClose) => <RefundConfirmTestModal onClose={onClose} />,
  },
  {
    overlay: {
      id: "calendar-sync",
      name: "CalendarSyncConflictModal",
      description: "Sync conflict resolution dialog with radio groups, conflict table, and resolve/cancel buttons.",
      sourcePath: "src/components/dashboard/settings/calendar-sync-conflict-modal.tsx",
      hasFocusTrap: true,
      focusTrapType: "FocusTrap component",
    },
    renderModal: (onClose) => <CalendarSyncTestModal onClose={onClose} />,
  },
  {
    overlay: {
      id: "receipt",
      name: "ReceiptModal",
      description: "Transaction receipt with print/share buttons, tip presets, custom input, and total summary.",
      sourcePath: "src/components/receipt/ReceiptModal.tsx",
      hasFocusTrap: true,
      focusTrapType: "FocusTrap component",
    },
    renderModal: (onClose) => <ReceiptTestModal onClose={onClose} />,
  },
  {
    overlay: {
      id: "onboarding",
      name: "OnboardingWalkthrough",
      description: "Coach-mark tour dialog with step navigation, step dots, and back/skip/next buttons.",
      sourcePath: "src/components/dashboard/onboarding-walkthrough.tsx",
      hasFocusTrap: true,
      focusTrapType: "Inline trap",
      note: "Uses inline handleKeyDown instead of FocusTrap component.",
    },
    renderModal: (onClose) => <OnboardingTestModal onClose={onClose} />,
  },
];

// ── Result badge ─────────────────────────────────────────────────────────────

function TestResultBadge({ result }: { result: boolean | null }) {
  if (result === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
        ✓ Pass
      </span>
    );
  }
  if (result === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">
        ✗ Fail
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-xs font-semibold text-slate-400">
      — N/A
    </span>
  );
}

// ── Overlay test card ─────────────────────────────────────────────────────────

function OverlayTestCard({ overlay, renderModal, onTestComplete, onTestStart }: OverlayCaseProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const testId = useId();

  const handleOpenAndTest = useCallback(async () => {
    setOpen(true);
    setResult(null);
    setTesting(true);
    onTestStart(overlay.id);
    // Wait for React to render the modal
    await tick();
    await tick();
    // Find the modal's FocusTrap container (scoped to this card)
    const card = containerRef.current;
    const dialog = card?.querySelector<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    if (!card || !dialog) {
      const err: TestResult = {
        tabForward: null,
        tabBackward: null,
        focusOnMount: false,
        offendingElement: null,
        error: "Could not find the modal dialog in the DOM",
        focusableCount: 0,
      };
      setResult(err);
      setTesting(false);
      onTestComplete(overlay.id, err);
      return;
    }
    const trapContainer = dialog.parentElement;
    if (!trapContainer) {
      const err: TestResult = {
        tabForward: null,
        tabBackward: null,
        focusOnMount: false,
        offendingElement: null,
        error: "Could not find the FocusTrap container",
        focusableCount: 0,
      };
      setResult(err);
      setTesting(false);
      onTestComplete(overlay.id, err);
      return;
    }
    const testResult = await runTabCycleTest(trapContainer);
    setResult(testResult);
    setTesting(false);
    onTestComplete(overlay.id, testResult);
  }, [overlay.id, onTestComplete, onTestStart]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setResult(null);
    setTesting(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">{overlay.name}</h3>
          {overlay.note && (
            <p className="mt-0.5 text-xs font-medium text-amber-400">{overlay.note}</p>
          )}
        </div>
        <div
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            overlay.hasFocusTrap
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-red-500/15 text-red-300"
          }`}
        >
          {overlay.hasFocusTrap ? "Trapped" : "Not trapped"}
        </div>
      </div>

      <p className="mb-2 text-xs leading-relaxed text-slate-400">
        {overlay.description}
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
        <span className="font-mono">{overlay.sourcePath}</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">{overlay.focusTrapType}</span>
      </div>

      {/* Test controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleOpenAndTest}
          disabled={open && testing}
          aria-describedby={result ? `${testId}-result` : undefined}
          aria-busy={testing}
          className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {testing ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              Testing…
            </>
          ) : (
            "Open + Test focus trap"
          )}
        </button>
        {open && (
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Close modal
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div id={`${testId}-result`} className="mt-4 space-y-2 border-t border-white/5 pt-4" role="status" aria-live="polite">
          {result.error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xs font-medium text-red-300">Error: {result.error}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Elements: <span className="font-mono text-white">{result.focusableCount}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  Tab cycle: <TestResultBadge result={result.tabForward} />
                </span>
                <span className="flex items-center gap-1.5">
                  Shift+Tab cycle: <TestResultBadge result={result.tabBackward} />
                </span>
                <span className="flex items-center gap-1.5">
                  Focus on mount: <TestResultBadge result={result.focusOnMount} />
                </span>
              </div>
              {result.offendingElement && (
                <p className="text-xs font-medium text-red-300">
                  First offending element:{" "}
                  <span className="font-mono text-red-200">{result.offendingElement}</span>
                </p>
              )}
              {result.tabForward && result.tabBackward && (
                <p className="text-xs font-medium text-emerald-300">
                  All focus trap checks passed.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal rendered via portal */}
      {open && renderModal(handleClose)}
    </div>
  );
}

// ── Summary section ──────────────────────────────────────────────────────────

function TestSummary({ results }: { results: Record<string, TestResult> }) {
  const entries = Object.values(results);
  if (entries.length === 0) return null;
  const passed = entries.filter((r) => r.tabForward && r.tabBackward).length;
  const failed = entries.filter((r) => r.tabForward === false || r.tabBackward === false).length;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-md">
      <p className="text-sm font-semibold text-white">
        Results: {passed} passed, {failed} failed, {entries.length - passed - failed} inconclusive
      </p>
    </div>
  );
}

// ── FocusTrapTester component ────────────────────────────────────────────────

export function FocusTrapTester() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [running, setRunning] = useState<string | null>(null);

  const handleTestComplete = useCallback((id: string, result: TestResult) => {
    setResults((prev) => ({ ...prev, [id]: result }));
  }, []);

  const handleTestStart = useCallback((id: string) => {
    setRunning(id);
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Clean up running state when no test is running
  useEffect(() => {
    if (!running) return;
    const timeout = setTimeout(() => setRunning(null), 10000);
    return () => clearTimeout(timeout);
  }, [running]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-xs font-bold text-cyan-300">
          T
        </span>
        <h2 className="text-lg font-semibold text-white">Focus Trap Tester</h2>
      </div>

      <p className="text-sm leading-relaxed text-slate-400">
        This harness enumerates every modal and overlay in the app and runs an automated
        tab-cycle check. Press <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300">Open + Test focus trap</kbd>{" "}
        to open the overlay and verify that focus cycling works correctly.
      </p>

      <TestSummary results={results} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {overlayEntries.map((entry) => (
          <OverlayTestCard
            key={entry.overlay.id}
            overlay={entry.overlay}
            renderModal={entry.renderModal}
            onTestComplete={handleTestComplete}
            onTestStart={handleTestStart}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">What is being tested?</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong>Tab cycle:</strong> pressing Tab on the last focusable element wraps
            focus back to the first.
          </li>
          <li>
            <strong>Shift+Tab cycle:</strong> pressing Shift+Tab on the first focusable
            element wraps focus back to the last.
          </li>
          <li>
            <strong>Focus on mount:</strong> focus is placed inside the trap when the
            overlay opens.
          </li>
          <li>Each test reports the first offending element (by tag and text content).</li>
        </ul>
      </div>

      <LiveRegion>
        {running ? "Focus trap test in progress." : results ? `${Object.keys(results).length} tests completed.` : ""}
      </LiveRegion>
    </div>
  );
}
