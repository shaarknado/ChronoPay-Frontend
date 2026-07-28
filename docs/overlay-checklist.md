# Overlay & Modal Accessibility Checklist

This checklist defines the standardized implementation rules for all dialogs, modals, and overlays within the ChronoPay design system to ensure strict compliance with WCAG 2.1 AA accessibility standards.

## 🪤 1. Focus Management (Focus Trap)
- [ ] Every overlay must be wrapped in the `<FocusTrap>` component from `src/components/common/FocusTrap.tsx`.
- [ ] Focus must immediately move to the first actionable element within the dialog when it opens.
- [ ] Focus must not escape the overlay while it is active (pressing Tab on the last element must loop back to the first).
- [ ] Focus must return to the trigger element that opened the overlay when the dialog is closed. If the trigger element was deleted from the DOM, focus must return to the nearest logical anchor (e.g. `[data-focus-fallback]`, `<main>`, or `<body>`).

## 🗣️ 2. Screen Reader Semantics
- [ ] The overlay container must have `role="dialog"`.
- [ ] The overlay container must have `aria-modal="true"` to hide the rest of the page from assistive technologies.
- [ ] The dialog must be labelled. If there is a visible heading, use `aria-labelledby="[id-of-heading]"`. Otherwise, use `aria-label="[Descriptive Name]"`.

## ⌨️ 3. Keyboard Interactions
- [ ] Pressing the `Escape` key must close the overlay.
- [ ] All interactive elements inside the dialog must have a visible focus ring (`focus-visible:ring-2 focus-visible:ring-cyan-300`).

## 📱 4. Responsive & UI Guidelines
- [ ] The overlay must be fully usable on mobile screens without horizontal scrolling.
- [ ] If the content is taller than the viewport, the dialog content area should scroll vertically while keeping the modal constraints.
- [ ] A backdrop (e.g., `bg-black/50 backdrop-blur-sm`) must separate the modal visually from the main page content.
- [ ] Include a clear and accessible close button (e.g., `aria-label="Close dialog"`).

## ⚠️ Notes on Non-Modal Overlays (Toasts)
- Unlike modal dialogs, **Toasts/Notifications must NOT trap focus** as they are non-blocking.
- Toasts should use `role="status"` or `role="alert"` (depending on severity) and `aria-live` attributes to notify screen readers without interrupting the user's flow.

---

## 🎯 Tooltip Smart-Placement Rules

Tooltips use a built-in placement engine (no external library) in
`src/app/components/ui/tooltip.tsx`.

### Algorithm

1. **Preferred side** — attempt to place on the `side` prop (default `"top"`).
2. **Flip** — if the preferred side has less room than `tooltip height + offset`,
   flip to the opposite side. If the opposite side also lacks room, keep the
   preferred side (least-bad fallback).
3. **Shift** — after the axis is resolved, clamp `top`/`left` so the tooltip
   stays at least `viewportPadding` (default 6 px) from every viewport edge.
4. **Fixed coordinates** — the tooltip is rendered with `position: fixed` so
   ancestor `overflow: hidden` or CSS `transform` never clips it.
5. **Arrow tracking** — the arrow is repositioned to always point at the trigger
   centre even after a shift.
6. **Recalculation triggers** — position is recalculated on `resize`, `scroll`
   (capture phase, to catch scrollable ancestors), and whenever `side`, `align`,
   `offset`, or `viewportPadding` props change.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `content` | `string` | — | Tooltip text |
| `side` | `"top"\|"bottom"\|"left"\|"right"` | `"top"` | Preferred placement axis |
| `align` | `"start"\|"center"\|"end"` | `"center"` | Cross-axis alignment |
| `offset` | `number` | `8` | Gap between trigger and tooltip (px) |
| `viewportPadding` | `number` | `6` | Min distance from viewport edges (px) |
| `className` | `string` | `""` | Extra class on the wrapper `<div>` |

### Edge Cases

| Scenario | Behaviour |
|---|---|
| Near top edge | Flips to `"bottom"` |
| Near bottom edge | Flips to `"top"` |
| Near left/right edge | Shifts horizontally until `viewportPadding` is satisfied |
| All sides clipped (very small viewport) | Clamps to viewport with `viewportPadding` |
| `position: fixed` ancestors | No effect — tooltip uses fixed coordinates |
| `overflow: hidden` ancestors | No clip — tooltip escapes via fixed positioning |
| RTL layouts | Engine uses `getBoundingClientRect()` (layout-aware) — works correctly |
| `iframe` boundaries | `window.innerWidth/Height` reports the iframe viewport; placement is constrained to it |
| Scroll while open | `scroll` listener (capture phase) recalculates on every scroll frame |
| Resize while open | `resize` listener recalculates |
| Reduced motion | No transform animation; tooltip appears/disappears instantly (CSS `transition-opacity` only) |

### Accessibility

| Requirement | Implementation |
|---|---|
| Tooltip role | `role="tooltip"` on the tooltip `<div>` |
| Linked to trigger | `aria-describedby` set to tooltip `id` only while visible |
| Keyboard toggle | `Enter` / `Space` on trigger toggles; `Escape` closes and returns focus |
| Focus | Tooltip itself is never focusable |
| Touch | `touchstart` toggles; outside `mousedown` closes |
| Icon | `aria-hidden="true"` on the `<Info>` icon |

---

## 🔬 Focus Trap Tester Harness

A design-review page at `/design-review/focus-trap` provides automated tab-cycle verification for every overlay in the app.

**Location:** `src/app/design-review/focus-trap/page.tsx`
**Component:** `src/components/design/focus-trap-tester.tsx`

### What it tests

1. **Tab cycle** — pressing Tab on the last focusable element wraps focus back to the first.
2. **Shift+Tab cycle** — pressing Shift+Tab on the first focusable element wraps focus back to the last.
3. **Focus on mount** — focus is placed inside the trap when the overlay opens.
4. **First offending element** — reports the tag name and text content of the element that broke the cycle.

### Overlays covered

| Overlay | Source | Trap type |
|---|---|---|
| FocusTrap (Base) | `src/components/common/FocusTrap.tsx` | FocusTrap component |
| WalletConnectModal | `src/components/dashboard/WalletConnectModal.tsx` | FocusTrap component |
| RefundConfirmationModal | `src/components/dashboard/refund-confirmation-modal.tsx` | FocusTrap component |
| CalendarSyncConflictModal | `src/components/dashboard/settings/calendar-sync-conflict-modal.tsx` | FocusTrap component |
| ReceiptModal | `src/components/receipt/ReceiptModal.tsx` | FocusTrap component |
| OnboardingWalkthrough | `src/components/dashboard/onboarding-walkthrough.tsx` | Inline trap |

### Usage

1. Navigate to `/design-review/focus-trap`.
2. Click **Open + Test focus trap** on any overlay card.
3. The modal opens and the automated test runs.
4. Results show pass/fail for each check and the first offending element if any.

### Adding a new overlay

To add a new overlay to the tester, edit `src/components/design/focus-trap-tester.tsx`:

1. Create a test modal component (mirroring the real overlay's focusable-element structure).
2. Add an entry to the `overlayEntries` array with the overlay's metadata and render function.
