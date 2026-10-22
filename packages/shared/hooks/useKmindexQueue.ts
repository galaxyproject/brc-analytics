import { API_BASE_URL } from "@repo/shared/config/api";
import ky from "ky";
import { useEffect, useState } from "react";

// How backed up searches on the BRC service account are, as the backend's
// /galaxy/kmindex/queue reports it. Ages are minutes; null where there is
// nothing to measure.
export interface KmindexQueue {
  as_of: string;
  oldest_waiting_minutes: number | null;
  recent_searches: number;
  recent_wait_minutes: number | null;
  recent_wait_p90_minutes: number | null;
  running: number;
  waiting: number;
  window_minutes: number;
}

// The backend rebuilds the snapshot at most once a minute, so asking more
// often would only read the same answer.
const QUEUE_POLL_MS = 60_000;

type Listener = (queue: KmindexQueue) => void;

// One poll for the whole page, however many components want the queue: the
// search form and a waiting search's status both ask for it on the same
// screen. It runs while anything is subscribed, and the reading goes with
// the last subscriber, so no reading outlives the wait it describes.
const listeners = new Set<Listener>();
let latest: { at: number; queue: KmindexQueue } | null = null;
let controller: AbortController | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Read the queue for every subscriber, unless nobody can see the page.
 * @param force - Read even if the last reading is still fresh.
 */
function read(force = false): void {
  if (document.hidden) return;
  if (!force && latest && Date.now() - latest.at < QUEUE_POLL_MS) return;
  const signal = controller?.signal;
  ky.get(`${API_BASE_URL}/galaxy/kmindex/queue`, { retry: 0, signal })
    .json<KmindexQueue>()
    .then((queue) => {
      if (signal?.aborted) return;
      latest = { at: Date.now(), queue };
      listeners.forEach((listener) => listener(queue));
    })
    .catch(() => undefined);
}

/**
 * Catch up when a tab that was skipped while hidden comes back.
 */
function onVisible(): void {
  if (!document.hidden) read();
}

/**
 * Join the shared poll, starting it if this is the first subscriber.
 * @param listener - Called with each new reading.
 * @returns Leaves the poll, stopping it after the last subscriber.
 */
function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    controller = new AbortController();
    read(true);
    timer = setInterval(() => read(true), QUEUE_POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
  } else if (latest) {
    listener(latest.queue);
  }
  return (): void => {
    listeners.delete(listener);
    if (listeners.size) return;
    if (timer) clearInterval(timer);
    controller?.abort();
    document.removeEventListener("visibilitychange", onVisible);
    timer = null;
    controller = null;
    latest = null;
  };
}

/**
 * Poll the search queue while `active`, e.g. while this page's job is waiting.
 *
 * A failed read keeps whatever was last shown: the note is a nicety, and the
 * job's own status is what the page actually tracks.
 * @param active - Whether to poll at all.
 * @returns The latest snapshot, or null before one lands or while inactive.
 */
export function useKmindexQueue(active: boolean): KmindexQueue | null {
  const [queue, setQueue] = useState<KmindexQueue | null>(null);

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a queue reading must not outlive the wait it describes
      setQueue(null);
      return;
    }
    return subscribe(setQueue);
  }, [active]);

  return queue;
}
