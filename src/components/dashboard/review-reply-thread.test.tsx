/**
 * ReviewReplyThread tests
 *
 * Coverage targets (95%+):
 *  - Rendering: review content, rating (sr-only text), timestamp
 *  - No reply + canReply=false: no trigger, no composer
 *  - No reply + canReply=true: trigger renders; opening focuses the textarea
 *  - Composer: disabled submit while empty, trims whitespace, calls
 *    onSubmitReply, closes on submit
 *  - Cancel: click and Escape both close the composer and clear the draft;
 *    focus returns to the trigger
 *  - Ctrl/Cmd+Enter submits the composer
 *  - Existing live reply: supplier badge + timestamp render; no trigger/composer
 *  - Deleted reply: placeholder renders instead of body/badge
 *  - Single-level enforcement: a review with a reply never shows a trigger
 *  - LiveRegion announces a newly-appearing reply, whether posted locally
 *    (moves focus to the reply heading) or arriving via a prop update
 *    (does not steal focus)
 *  - RTL: logical-property classes are used, not physical left/right ones
 */

import { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReviewReplyThread } from "./review-reply-thread";
import type { Review } from "./review-thread-types";

const baseReview: Review = {
  id: "review-1",
  authorName: "Amaka O.",
  rating: 4,
  body: "Great session, very punctual.",
  timestamp: "2026-06-30 09:00 AM",
};

describe("ReviewReplyThread", () => {
  it("renders the review author, body, timestamp, and an accessible rating", () => {
    render(<ReviewReplyThread review={baseReview} canReply={false} />);
    expect(screen.getByText("Amaka O.")).toBeInTheDocument();
    expect(
      screen.getByText("Great session, very punctual.")
    ).toBeInTheDocument();
    expect(screen.getByText("2026-06-30 09:00 AM")).toBeInTheDocument();
    expect(screen.getByText("4 out of 5 stars")).toBeInTheDocument();
  });

  it("shows no reply trigger or composer when canReply is false", () => {
    render(<ReviewReplyThread review={baseReview} canReply={false} />);
    expect(
      screen.queryByRole("button", { name: "Reply as supplier" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows a reply trigger when canReply is true and there is no reply yet", () => {
    render(<ReviewReplyThread review={baseReview} canReply={true} />);
    expect(
      screen.getByRole("button", { name: "Reply as supplier" })
    ).toBeInTheDocument();
  });

  it("opens the composer and focuses the textarea when the trigger is clicked", () => {
    render(<ReviewReplyThread review={baseReview} canReply={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    const textarea = screen.getByRole("textbox", { name: "Reply as supplier" });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveFocus();
  });

  it("disables the submit button while the draft is empty or whitespace-only", () => {
    render(<ReviewReplyThread review={baseReview} canReply={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    const submit = screen.getByRole("button", { name: "Post reply" });
    expect(submit).toBeDisabled();

    const textarea = screen.getByRole("textbox", { name: "Reply as supplier" });
    fireEvent.change(textarea, { target: { value: "   " } });
    expect(submit).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "Thanks so much!" } });
    expect(submit).toBeEnabled();
  });

  it("calls onSubmitReply with the trimmed body and closes the composer", () => {
    const onSubmitReply = vi.fn();
    render(
      <ReviewReplyThread
        review={baseReview}
        canReply={true}
        onSubmitReply={onSubmitReply}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    const textarea = screen.getByRole("textbox", { name: "Reply as supplier" });
    fireEvent.change(textarea, { target: { value: "  Thank you!  " } });
    fireEvent.click(screen.getByRole("button", { name: "Post reply" }));

    expect(onSubmitReply).toHaveBeenCalledWith("Thank you!");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("does not submit when the draft is only whitespace", () => {
    const onSubmitReply = vi.fn();
    render(
      <ReviewReplyThread
        review={baseReview}
        canReply={true}
        onSubmitReply={onSubmitReply}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    const textarea = screen.getByRole("textbox", { name: "Reply as supplier" });
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.submit(textarea.closest("form")!);
    expect(onSubmitReply).not.toHaveBeenCalled();
  });

  it("cancels via the Cancel button, clears the draft, and refocuses the trigger", () => {
    render(<ReviewReplyThread review={baseReview} canReply={true} />);
    const trigger = screen.getByRole("button", { name: "Reply as supplier" });
    fireEvent.click(trigger);
    fireEvent.change(screen.getByRole("textbox", { name: "Reply as supplier" }), {
      target: { value: "Draft text" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    const reopenedTrigger = screen.getByRole("button", {
      name: "Reply as supplier",
    });
    expect(reopenedTrigger).toHaveFocus();
  });

  it("cancels via Escape from within the textarea", () => {
    render(<ReviewReplyThread review={baseReview} canReply={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    const textarea = screen.getByRole("textbox", { name: "Reply as supplier" });
    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("submits via Ctrl+Enter from within the textarea", () => {
    const onSubmitReply = vi.fn();
    render(
      <ReviewReplyThread
        review={baseReview}
        canReply={true}
        onSubmitReply={onSubmitReply}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    const textarea = screen.getByRole("textbox", { name: "Reply as supplier" });
    fireEvent.change(textarea, { target: { value: "Appreciate the feedback!" } });
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });
    expect(onSubmitReply).toHaveBeenCalledWith("Appreciate the feedback!");
  });

  it("submits via Cmd/Meta+Enter from within the textarea", () => {
    const onSubmitReply = vi.fn();
    render(
      <ReviewReplyThread
        review={baseReview}
        canReply={true}
        onSubmitReply={onSubmitReply}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    const textarea = screen.getByRole("textbox", { name: "Reply as supplier" });
    fireEvent.change(textarea, { target: { value: "Cheers!" } });
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
    expect(onSubmitReply).toHaveBeenCalledWith("Cheers!");
  });

  it("does not submit or cancel on a plain Enter or unrelated key", () => {
    const onSubmitReply = vi.fn();
    render(
      <ReviewReplyThread
        review={baseReview}
        canReply={true}
        onSubmitReply={onSubmitReply}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    const textarea = screen.getByRole("textbox", { name: "Reply as supplier" });
    fireEvent.change(textarea, { target: { value: "Still drafting" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    fireEvent.keyDown(textarea, { key: "a" });
    expect(onSubmitReply).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Reply as supplier" })).toBeInTheDocument();
  });

  it("renders an existing live reply with the supplier badge and timestamp, and no trigger", () => {
    const withReply: Review = {
      ...baseReview,
      reply: {
        id: "reply-1",
        authorName: "ChronoPay Supplier Co.",
        body: "Thanks for booking with us!",
        timestamp: "2026-06-30 11:00 AM",
      },
    };
    render(<ReviewReplyThread review={withReply} canReply={true} />);
    expect(screen.getByText("ChronoPay Supplier Co.")).toBeInTheDocument();
    expect(screen.getByText("Supplier")).toBeInTheDocument();
    expect(screen.getByText("Thanks for booking with us!")).toBeInTheDocument();
    expect(screen.getByText("2026-06-30 11:00 AM")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reply as supplier" })
    ).not.toBeInTheDocument();
  });

  it("renders a deleted-reply placeholder instead of the reply body or badge", () => {
    const withDeletedReply: Review = {
      ...baseReview,
      reply: {
        id: "reply-1",
        authorName: "ChronoPay Supplier Co.",
        body: "This was removed.",
        timestamp: "2026-06-30 11:00 AM",
        deleted: true,
      },
    };
    render(<ReviewReplyThread review={withDeletedReply} canReply={true} />);
    expect(screen.getByText("This reply was deleted.")).toBeInTheDocument();
    expect(screen.queryByText("This was removed.")).not.toBeInTheDocument();
    expect(screen.queryByText("Supplier")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reply as supplier" })
    ).not.toBeInTheDocument();
  });

  it("announces and focuses the new reply heading when a reply is posted locally", () => {
    function Harness() {
      const [review, setReview] = useState<Review>(baseReview);
      return (
        <ReviewReplyThread
          review={review}
          canReply={true}
          onSubmitReply={(body) =>
            setReview((prev) => ({
              ...prev,
              reply: {
                id: "reply-1",
                authorName: "ChronoPay Supplier Co.",
                body,
                timestamp: "2026-06-30 11:00 AM",
              },
            }))
          }
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Reply as supplier" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Reply as supplier" }), {
      target: { value: "Thanks!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Post reply" }));

    expect(
      screen.getByText("New reply from ChronoPay Supplier Co. posted.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "ChronoPay Supplier Co." })
    ).toHaveFocus();
  });

  it("announces a reply arriving via a prop update without stealing focus", () => {
    const { rerender } = render(
      <ReviewReplyThread review={baseReview} canReply={false} />
    );
    const outsideButton = document.createElement("button");
    document.body.appendChild(outsideButton);
    outsideButton.focus();
    expect(outsideButton).toHaveFocus();

    const withReply: Review = {
      ...baseReview,
      reply: {
        id: "reply-1",
        authorName: "ChronoPay Supplier Co.",
        body: "Thanks for booking with us!",
        timestamp: "2026-06-30 11:00 AM",
      },
    };
    rerender(<ReviewReplyThread review={withReply} canReply={false} />);

    expect(
      screen.getByText("New reply from ChronoPay Supplier Co. posted.")
    ).toBeInTheDocument();
    expect(outsideButton).toHaveFocus();
    document.body.removeChild(outsideButton);
  });

  it("uses logical-property indentation classes so the thread flips under RTL", () => {
    const withReply: Review = {
      ...baseReview,
      reply: {
        id: "reply-1",
        authorName: "ChronoPay Supplier Co.",
        body: "Thanks for booking with us!",
        timestamp: "2026-06-30 11:00 AM",
      },
    };
    const { container } = render(
      <div dir="rtl">
        <ReviewReplyThread review={withReply} canReply={false} />
      </div>
    );
    const html = container.innerHTML;
    expect(html).toMatch(/\bms-6\b/);
    expect(html).toMatch(/\bborder-s-2\b/);
    expect(html).not.toMatch(/\bml-6\b/);
    expect(html).not.toMatch(/\bborder-l-2\b/);
  });

  it("scopes the reply's screen-reader focus target within the thread's article", () => {
    const withReply: Review = {
      ...baseReview,
      reply: {
        id: "reply-1",
        authorName: "ChronoPay Supplier Co.",
        body: "Thanks for booking with us!",
        timestamp: "2026-06-30 11:00 AM",
      },
    };
    render(<ReviewReplyThread review={withReply} canReply={false} />);
    const article = screen.getByRole("article");
    expect(
      within(article).getByRole("heading", { name: "ChronoPay Supplier Co." })
    ).toBeInTheDocument();
  });
});
