import { type KmindexQueue } from "@repo/shared/hooks/useKmindexQueue";

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
 * Sentences about the queue, for a reader whose search hasn't started.
 *
 * Each figure is left out when there's nothing behind it, rather than shown
 * as zero: no finished searches in the window says nothing about the wait.
 * @param queue - The snapshot.
 * @returns The sentences, possibly none.
 */
export function describeQueue(queue: KmindexQueue): string[] {
  const lines: string[] = [];
  if (queue.waiting > 0) {
    const searches = queue.waiting === 1 ? "search is" : "searches are";
    let line = `${queue.waiting} ${searches} waiting for a node on TACC's Vista cluster`;
    if (queue.oldest_waiting_minutes !== null && queue.waiting > 1)
      line += `; the longest has waited ${formatWait(queue.oldest_waiting_minutes)}`;
    lines.push(`${line}.`);
  }
  if (queue.recent_searches > 0 && queue.recent_wait_minutes !== null) {
    const hours = Math.round(queue.window_minutes / 60);
    const span = hours === 1 ? "hour" : `${hours} hours`;
    lines.push(
      `Searches that finished in the last ${span} waited about ${formatWait(queue.recent_wait_minutes)} to start.`
    );
  }
  return lines;
}
