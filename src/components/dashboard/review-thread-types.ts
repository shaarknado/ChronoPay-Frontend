/**
 * review-thread-types.ts
 *
 * Shared shapes for the review + supplier-reply thread feature.
 *
 * Design constraints
 * ──────────────────
 * • A review has AT MOST one reply — single-level threading only, no
 *   nested reply-to-reply trees (see #262).
 * • `reply.deleted` keeps the reply's id/timestamp/author around so a
 *   "This reply was deleted" placeholder can be rendered without losing
 *   the thread's shape, instead of removing the reply outright.
 */

export type ReviewReply = {
  id: string;
  /** Display name of the replying supplier. */
  authorName: string;
  body: string;
  /** Pre-formatted, human-readable timestamp (matches TimelineItem convention). */
  timestamp: string;
  /** When true, render the "deleted" placeholder instead of `body`. */
  deleted?: boolean;
};

export type Review = {
  id: string;
  authorName: string;
  /** 1–5 star rating. */
  rating: number;
  body: string;
  timestamp: string;
  /** At most one reply — enforced by the single-level thread UI. */
  reply?: ReviewReply;
};
