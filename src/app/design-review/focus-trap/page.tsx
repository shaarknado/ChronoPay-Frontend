import { FocusTrapTester } from "@/components/design/focus-trap-tester";
import Link from "next/link";

export default function FocusTrapTesterPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-slate-900">
              C
            </div>
            <span className="font-semibold tracking-tight">Design System — Focus Trap Tester</span>
          </div>
          <Link
            href="/design-review"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Review
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Focus Trap Tester Harness
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Automated tab-cycle verification for every modal and overlay in the
            ChronoPay design system. Each card below represents an overlay
            implementation; press the button to open it and run an accessibility
            check.
          </p>
        </section>

        <section className="space-y-8">
          <FocusTrapTester />
        </section>
      </main>
    </div>
  );
}
