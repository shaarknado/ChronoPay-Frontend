"use client";

/**
 * review-reply-thread.tsx
 *
 * A single review paired with, at most, one supplier reply — single-level
 * threading only, matching #262's "avoid unwieldy trees" requirement.
 *
 * Accessibility
 * ─────────────
 * • Reply composer label is programmatically associated via aria-labelledby.
 * • Escape cancels the composer; Cmd/Ctrl+Enter submits it.
 * • Opening the composer moves focus to the textarea; cancelling returns
 *   focus to the "Reply" trigger; submitting moves focus to the newly
 *   posted reply's heading (tabIndex={-1}) so keyboard/SR users land on
 *   the result instead of a vanished trigger.
 * • A polite LiveRegion announces new replies — both the local "I just
 *   replied" case and a reply arriving via a prop update (e.g. another
 *   session replying while this thread is open) — without stealing focus
 *   in the latter case.
 * • Star rating is never colour-only: an sr-only "N out of 5 stars"
 *   string carries the actual meaning (WCAG 1.4.1).
 *
 * Responsive & RTL
 * ─────────────────
 * • Threaded indentation uses logical-property utilities (ms-/ps-/border-s)
 *   instead of ml-/pl-/border-l, so the thread indents from the correct
 *   side automatically under dir="rtl".
 *
 * Supplier badge
 * ──────────────
 * • Deliberately does NOT reuse the interactive `RoleChip` component: that
 *   component is wired to the viewer's own `RoleContext` and lets them
 *   switch the whole app's active role — using it here would let clicking
 *   a reply's badge change the viewer's session role, which is unrelated
 *   to labelling who authored the reply. Instead this renders a static
 *   badge sourced from the same `ROLE_META.supplier` single source of
 *   truth (label/icon), styled with the existing dashboard `StatusChip`.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { LiveRegion } from "@/components/common/LiveRegion";
import { ROLE_META } from "@/app/components/navigation/role-nav";
import { StatusChip } from "./status-chip";
import type { Review, ReviewReply } from "./review-thread-types";

function SupplierBadge() {
  const meta = ROLE_META.supplier;
  return (
    <StatusChip tone="positive" className="gap-1">
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </StatusChip>
  );
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  const stars = Array.from({ length: 5 }, (_, i) => (i < rounded ? "★" : "☆")).join(
    ""
  );
  return (
    <span aria-hidden="true" className="text-amber-300">
      {stars}
    </span>
  );
}

function ReplyComposer({
  labelId,
  textareaId,
  draft,
  onDraftChange,
  onSubmit,
  onCancel,
  textareaRef,
}: {
  labelId: string;
  textareaId: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const isEmpty = draft.trim().length === 0;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="ms-6 border-s-2 border-white/10 ps-4 sm:ms-8 sm:ps-6"
    >
      <label
        id={labelId}
        htmlFor={textareaId}
        className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
      >
        Reply as supplier
      </label>
      <textarea
        ref={textareaRef}
        id={textareaId}
        aria-labelledby={labelId}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Thank the customer or address their feedback…"
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-white placeholder:text-slate-500 focus-ring-cyan"
      />
      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1.5 text-sm text-slate-300 hover:text-white focus-ring-cyan"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isEmpty}
          className="rounded-full bg-cyan-400/90 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 focus-ring-cyan disabled:cursor-not-allowed disabled:opacity-40"
        >
          Post reply
        </button>
      </div>
    </form>
  );
}

export function ReviewReplyThread({
  review,
  canReply,
  onSubmitReply,
}: {
  review: Review;
  /** Whether the current viewer may post the (single) supplier reply. */
  canReply: boolean;
  /** Called with the trimmed reply body on submit. Expected to update `review.reply` upstream. */
  onSubmitReply?: (body: string) => void;
}) {
  const threadId = useId();
  const titleId = `${threadId}-review-title`;
  const labelId = `${threadId}-reply-label`;
  const textareaId = `${threadId}-reply-textarea`;

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTriggerRef = useRef<HTMLButtonElement>(null);
  const replyHeadingRef = useRef<HTMLHeadingElement>(null);

  const previousReplyRef = useRef<ReviewReply | undefined>(review.reply);
  const justSubmittedRef = useRef(false);
  const wasComposerOpenRef = useRef(isComposerOpen);

  const hasLiveReply = !!review.reply && !review.reply.deleted;
  const hasDeletedReply = !!review.reply?.deleted;
  const showTrigger = !review.reply && canReply && !isComposerOpen;
  const showComposer = !review.reply && canReply && isComposerOpen;

  // Announce when a live reply newly appears, whether posted locally or
  // arriving via a prop update. Only steal focus for the local case.
  useEffect(() => {
    const previous = previousReplyRef.current;
    const current = review.reply;
    const isNewLiveReply =
      !!current &&
      !current.deleted &&
      (!previous || previous.id !== current.id || previous.deleted);

    if (isNewLiveReply && current) {
      setAnnouncement(`New reply from ${current.authorName} posted.`);
      if (justSubmittedRef.current) {
        replyHeadingRef.current?.focus();
      }
    }

    justSubmittedRef.current = false;
    previousReplyRef.current = current;
  }, [review.reply]);

  // Focus the textarea when the composer opens.
  useEffect(() => {
    if (isComposerOpen) {
      textareaRef.current?.focus();
    }
  }, [isComposerOpen]);

  // Return focus to the trigger when the composer closes without a reply
  // having been posted (e.g. cancelled).
  useEffect(() => {
    if (wasComposerOpenRef.current && !isComposerOpen && !review.reply) {
      replyTriggerRef.current?.focus();
    }
    wasComposerOpenRef.current = isComposerOpen;
  }, [isComposerOpen, review.reply]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    justSubmittedRef.current = true;
    onSubmitReply?.(trimmed);
    setDraft("");
    setIsComposerOpen(false);
  };

  const handleCancel = () => {
    setDraft("");
    setIsComposerOpen(false);
  };

  return (
    <article aria-labelledby={titleId} className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 id={titleId} className="text-sm font-semibold text-white">
          {review.authorName}
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <StarRating rating={review.rating} />
          <span className="sr-only">{review.rating} out of 5 stars</span>
          <span aria-hidden="true">·</span>
          <span>{review.timestamp}</span>
        </span>
      </header>

      <p className="text-sm leading-6 text-slate-300">{review.body}</p>

      {hasLiveReply && review.reply ? (
        <div className="ms-6 border-s-2 border-white/10 ps-4 sm:ms-8 sm:ps-6">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              ref={replyHeadingRef}
              tabIndex={-1}
              className="text-sm font-semibold text-white focus:outline-none"
            >
              {review.reply.authorName}
            </h4>
            <SupplierBadge />
            <span className="text-xs text-slate-500">
              {review.reply.timestamp}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            {review.reply.body}
          </p>
        </div>
      ) : null}

      {hasDeletedReply ? (
        <div className="ms-6 border-s-2 border-white/10 ps-4 sm:ms-8 sm:ps-6">
          <p className="text-sm italic text-slate-500">
            This reply was deleted.
          </p>
        </div>
      ) : null}

      {showTrigger ? (
        <div className="ms-6 ps-4 sm:ms-8 sm:ps-6">
          <button
            ref={replyTriggerRef}
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 focus-ring-cyan"
          >
            Reply as supplier
          </button>
        </div>
      ) : null}

      {showComposer ? (
        <ReplyComposer
          labelId={labelId}
          textareaId={textareaId}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          textareaRef={textareaRef}
        />
      ) : null}

      <LiveRegion>{announcement}</LiveRegion>
    </article>
  );
}
