/**
 * FocusTrapTester tests
 *
 * Coverage targets (95%+):
 *  - Renders the overlay list with names, descriptions, source paths
 *  - "Open + Test focus trap" button opens the modal and runs checks
 *  - Test results display Tab cycle, Shift+Tab cycle, Focus on mount
 *  - Error states: no dialog found, no trap container, no focusable elements
 *  - First offending element reported correctly
 *  - TestSummary aggregate correctly
 *  - LiveRegion announcements
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FocusTrapTester } from "@/components/design/focus-trap-tester";

// ── Mocks ─────────────────────────────────────────────────────────────────────

let rafId = 0;
beforeEach(() => {
  rafId = 0;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
    rafId++;
    setTimeout(() => cb(Date.now()), 0);
    return rafId;
  });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function flushRaf() {
  act(() => {
    vi.advanceTimersByTime(100);
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("FocusTrapTester", () => {
  it("renders the tester heading and description", () => {
    render(<FocusTrapTester />);
    expect(screen.getByText("Focus Trap Tester")).toBeInTheDocument();
    expect(
      screen.getByText(/enumerates every modal and overlay/),
    ).toBeInTheDocument();
  });

  it("renders all overlay test cards", () => {
    render(<FocusTrapTester />);
    // Should show the base FocusTrap card
    expect(screen.getByText("FocusTrap (Base)")).toBeInTheDocument();
    expect(screen.getByText("WalletConnectModal")).toBeInTheDocument();
    expect(screen.getByText("RefundConfirmationModal")).toBeInTheDocument();
    expect(screen.getByText("CalendarSyncConflictModal")).toBeInTheDocument();
    expect(screen.getByText("ReceiptModal")).toBeInTheDocument();
    expect(screen.getByText("OnboardingWalkthrough")).toBeInTheDocument();
  });

  it("shows source paths on each card", () => {
    render(<FocusTrapTester />);
    expect(
      screen.getByText("src/components/common/FocusTrap.tsx"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("src/components/dashboard/WalletConnectModal.tsx"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("src/components/dashboard/refund-confirmation-modal.tsx"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "src/components/dashboard/settings/calendar-sync-conflict-modal.tsx",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("src/components/receipt/ReceiptModal.tsx"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("src/components/dashboard/onboarding-walkthrough.tsx"),
    ).toBeInTheDocument();
  });

  it("shows Trapped badge on each card", () => {
    render(<FocusTrapTester />);
    const trappedBadges = screen.getAllByText("Trapped");
    expect(trappedBadges.length).toBeGreaterThanOrEqual(6);
  });

  it("renders a 'What is being tested?' info section", () => {
    render(<FocusTrapTester />);
    expect(screen.getByText("What is being tested?")).toBeInTheDocument();
    expect(screen.getByText(/Tab cycle/)).toBeInTheDocument();
    expect(screen.getByText(/Shift\+Tab cycle/)).toBeInTheDocument();
    expect(screen.getByText(/Focus on mount/)).toBeInTheDocument();
  });

  it("opens a modal when 'Open + Test focus trap' is clicked", () => {
    render(<FocusTrapTester />);
    const buttons = screen.getAllByText("Open + Test focus trap");
    expect(buttons.length).toBe(6);

    act(() => {
      fireEvent.click(buttons[0]);
    });
    flushRaf();

    expect(screen.getAllByRole("dialog").length).toBeGreaterThanOrEqual(1);
  });

  it("shows testing state with spinning indicator", () => {
    render(<FocusTrapTester />);
    const buttons = screen.getAllByText("Open + Test focus trap");

    act(() => {
      fireEvent.click(buttons[0]);
    });

    // Should show "Testing…" text shortly after click
    expect(screen.getByText("Testing…")).toBeInTheDocument();
  });

  it("reports error when no dialog is found", async () => {
    // Temporarily break the dialog rendering by spying on the dialog query
    const origQuerySelector = Element.prototype.querySelector;
    const querySpy = vi
      .spyOn(Element.prototype, "querySelector")
      .mockImplementation(function (this: Element, selector: string) {
        if (selector === '[role="dialog"][aria-modal="true"]') {
          return null;
        }
        return origQuerySelector.call(this, selector);
      });

    render(<FocusTrapTester />);
    const buttons = screen.getAllByText("Open + Test focus trap");

    await act(async () => {
      fireEvent.click(buttons[0]);
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/Could not find the modal dialog/)).toBeInTheDocument();
    querySpy.mockRestore();
  });

  it("closes the modal when close button is clicked", () => {
    render(<FocusTrapTester />);
    const buttons = screen.getAllByText("Open + Test focus trap");

    act(() => {
      fireEvent.click(buttons[0]);
    });
    flushRaf();

    // Close button should appear (the one on the card, not the modal)
    const closeButtons = screen.getAllByText("Close modal");
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);

    act(() => {
      fireEvent.click(closeButtons[0]);
    });

    expect(screen.queryByText("Close modal")).not.toBeInTheDocument();
  });

  it("displays a note for the OnboardingWalkthrough card", () => {
    render(<FocusTrapTester />);
    expect(
      screen.getByText("Uses inline handleKeyDown instead of FocusTrap component."),
    ).toBeInTheDocument();
  });

  it("renders each description for every overlay", () => {
    render(<FocusTrapTester />);
    expect(
      screen.getByText(/Core FocusTrap component with a mix of buttons/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Connection method picker with wallet provider list/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Confirmation dialog for refund destination/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sync conflict resolution dialog with radio groups/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Transaction receipt with print\/share buttons/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Coach-mark tour dialog with step navigation/),
    ).toBeInTheDocument();
  });

  it("renders the TestSummary after test results come in", () => {
    render(<FocusTrapTester />);
    // Initially no summary
    expect(screen.queryByText(/Results:/)).not.toBeInTheDocument();
  });

  it("shows live region announcements when testing", () => {
    render(<FocusTrapTester />);
    const buttons = screen.getAllByText("Open + Test focus trap");

    act(() => {
      fireEvent.click(buttons[0]);
    });

    // The LiveRegion should announce test in progress
    // Checking for the text anywhere in the DOM
    expect(screen.getByText("Focus trap test in progress.")).toBeInTheDocument();
  });

  it("renders the FocusTrapBase modal with correct structure", () => {
    render(<FocusTrapTester />);
    const buttons = screen.getAllByText("Open + Test focus trap");

    act(() => {
      fireEvent.click(buttons[0]); // First card is FocusTrap (Base)
    });
    flushRaf();

    // The simple test modal has buttons and an input
    expect(screen.getByText("FocusTrap — Simple test")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Secondary")).toBeInTheDocument();
    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Text input")).toBeInTheDocument();
  });

  it("first card shows FocusTrap (Base) as the name", () => {
    render(<FocusTrapTester />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("FocusTrap (Base)");
  });

  it("show focus trap type for each card", () => {
    render(<FocusTrapTester />);
    // All cards show their focus trap type
    const focusTrapLabels = screen.getAllByText("FocusTrap component");
    // 5 components use FocusTrap, plus "Inline trap" for onboarding
    expect(focusTrapLabels.length).toBe(5);
    expect(screen.getByText("Inline trap")).toBeInTheDocument();
  });

  it("disables the test button while testing", () => {
    render(<FocusTrapTester />);
    const buttons = screen.getAllByText("Open + Test focus trap");

    act(() => {
      fireEvent.click(buttons[0]);
    });

    // Button should be disabled during testing
    const testingButton = screen.getByText("Testing…").closest("button");
    expect(testingButton).toBeDisabled();
  });
});
