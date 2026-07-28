# ReviewReplyThread Component API

The `ReviewReplyThread` component renders a customer review paired with, at
most, one supplier reply. Threading is intentionally single-level — a review
can have zero or one reply, never a reply-to-a-reply — to keep the UI simple
to scan and review (see issue #262).

## Props

| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `review` | `Review` | Yes | The review to display, optionally carrying its one reply. |
| `canReply` | `boolean` | Yes | Whether the current viewer may post the reply (e.g. `role === "supplier"` **and** `review.reply` is not yet set). Computed by the consumer — this component stays decoupled from `RoleContext` so it's easy to test and reuse. |
| `onSubmitReply` | `(body: string) => void` | No | Called with the trimmed reply body on submit. The consumer is expected to update `review.reply` (e.g. via state or a mutation) in response — the component reacts to that prop change by closing the composer, announcing the reply, and moving focus to it. |

## Data shape

```typescript
type ReviewReply = {
  id: string;
  authorName: string;
  body: string;
  timestamp: string; // pre-formatted, human-readable
  deleted?: boolean; // renders a placeholder instead of removing the reply
};

type Review = {
  id: string;
  authorName: string;
  rating: number; // 1–5
  body: string;
  timestamp: string;
  reply?: ReviewReply; // at most one — enforced by the UI, not just the type
};
```

## Usage example

```tsx
import { useState } from "react";
import { ReviewReplyThread } from "@/components/dashboard/review-reply-thread";
import type { Review } from "@/components/dashboard/review-thread-types";

function ReviewsPanel({ initialReview, isSupplierViewer }: {
  initialReview: Review;
  isSupplierViewer: boolean;
}) {
  const [review, setReview] = useState(initialReview);

  return (
    <ReviewReplyThread
      review={review}
      canReply={isSupplierViewer && !review.reply}
      onSubmitReply={(body) =>
        setReview((prev) => ({
          ...prev,
          reply: {
            id: crypto.randomUUID(),
            authorName: "Your business name",
            body,
            timestamp: new Date().toLocaleString(),
          },
        }))
      }
    />
  );
}
```

## Supplier badge

The reply's "Supplier" badge is **not** the interactive `RoleChip` used in
the header. `RoleChip` is wired to the viewer's own `RoleContext` and lets
them switch the whole app's active role — reusing it here would mean
clicking a reply's badge could change the viewer's session role, which has
nothing to do with labelling who wrote the reply. Instead, the badge is a
static element built from `ROLE_META.supplier` (the same single source of
truth `RoleChip` reads its label/icon from) rendered with the existing
`StatusChip` component, so the visual language stays consistent without
reusing role-switching behavior where it doesn't belong.

## Accessibility

- The review and its reply/composer live in one `<article>`, labelled by
  the review author's `<h3>` via `aria-labelledby`.
- The star rating is never color-only: it's `aria-hidden`, paired with an
  `sr-only` "N out of 5 stars" string carrying the actual meaning (WCAG
  1.4.1).
- The reply composer's `<textarea>` is associated with its label via
  `aria-labelledby`; the submit button is `disabled` while the draft is
  empty or whitespace-only.
- **Keyboard**: `Escape` cancels the composer; `Cmd/Ctrl+Enter` submits it.
- **Focus management**: opening the composer focuses the textarea;
  cancelling returns focus to the "Reply as supplier" trigger; submitting
  moves focus to the newly posted reply's heading (`tabIndex={-1}`) so
  keyboard and screen-reader users land on the result instead of a trigger
  that no longer exists.
- **Live announcements**: a polite `LiveRegion` announces a newly-appearing
  reply. This fires both when the current viewer posts it and when a reply
  arrives via a prop update (e.g. another session replying while this
  thread is open) — but focus is only moved for the local case, so an
  unrelated update never steals focus from whatever the viewer was doing.
- **Deleted replies**: `reply.deleted` renders a "This reply was deleted."
  placeholder in place of the body and badge, keeping the thread's shape
  instead of collapsing it.

## Responsive behavior

- The composer and reply both indent under the review using padding/margin
  that scales at the `sm` breakpoint, matching other dashboard panel
  spacing conventions.

## RTL

- Threaded indentation uses Tailwind's logical-property utilities
  (`ms-*`, `ps-*`, `border-s-*`) instead of physical `ml-*`/`pl-*`/`border-l-*`
  ones, so the thread indents from the correct side automatically under
  `dir="rtl"` without any component-level branching.

## Dark mode

The dashboard currently ships one dark visual theme for panel-style
components (`PanelShell`, `StatusChip`, etc.), which `ReviewReplyThread`
matches — it uses the same fixed slate/cyan palette rather than the
`data-theme="light"` CSS-variable tokens, consistent with how those sibling
components are already built.
