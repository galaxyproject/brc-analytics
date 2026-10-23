import { type KmindexQueue } from "@repo/shared/hooks/useKmindexQueue";

// Past this, a new search is likely to sit in line for a while too.
export const QUEUE_BUSY_MINUTES = 10;

/**
 * A wait in minutes, the way a person would say it.
 * @param minutes - Minutes, possibly fractional.
 * @returns E.g. "under a minute", "12 min", "2 h 20 min".
 */
export function formatWait(minutes: number): string {
  if (minutes < 1) return "under a minute";
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/**
 * How long searches have been waiting to start lately, when that's long
 * enough to mention.
 *
 * The larger of the oldest search still in line and the recent typical wait:
 * the recent figure only counts searches once they finish, so on its own it
 * lags a backlog that is building right now.
 * @param queue - The snapshot, or null before it lands.
 * @returns Minutes, or null when the queue is moving.
 */
export function busyWait(queue: KmindexQueue | null): number | null {
  if (!queue) return null;
  const recent = queue.recent_searches > 0 ? queue.recent_wait_minutes : null;
  const wait = Math.max(queue.oldest_waiting_minutes ?? 0, recent ?? 0);
  return wait >= QUEUE_BUSY_MINUTES ? wait : null;
}

/**
 * A sentence about the recent wait, when demand is high enough to mention.
 * @param queue - The snapshot, or null before it lands.
 * @param lead - Everything before the wait itself.
 * @returns The sentence, or null when the queue is moving.
 */
function busySentence(queue: KmindexQueue | null, lead: string): string | null {
  const wait = busyWait(queue);
  return wait === null ? null : `${lead} ${formatWait(wait)} to start.`;
}

/**
 * A heads-up for someone about to submit, when demand is high.
 * @param queue - The snapshot, or null before it lands.
 * @returns The sentence, or null when the queue is moving.
 */
export function busyNotice(queue: KmindexQueue | null): string | null {
  return busySentence(
    queue,
    "Heads up, demand is quite high right now. Recent searches have waited about"
  );
}

/**
 * What to tell someone whose search is in line, when demand is high.
 * @param queue - The snapshot, or null before it lands.
 * @returns The sentence, or null when the queue is moving.
 */
export function describeQueue(queue: KmindexQueue | null): string | null {
  return busySentence(
    queue,
    "Demand is quite high right now; recent searches have waited about"
  );
}
