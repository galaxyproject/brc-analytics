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
    const controller = new AbortController();
    const read = (): void => {
      ky.get(`${API_BASE_URL}/galaxy/kmindex/queue`, {
        retry: 0,
        signal: controller.signal,
      })
        .json<KmindexQueue>()
        .then(setQueue)
        .catch(() => undefined);
    };
    read();
    const timer = setInterval(read, QUEUE_POLL_MS);
    return (): void => {
      clearInterval(timer);
      controller.abort();
    };
  }, [active]);

  return queue;
}
