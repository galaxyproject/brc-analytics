import { API_BASE_URL } from "@repo/shared/config/api";
import ky, { HTTPError } from "ky";
import { useEffect, useState } from "react";

// Where a stored search stands, as far as one status check can tell.
// "expired" is a job Galaxy no longer has, so its results are gone too.
export type SearchStatus =
  | "checking"
  | "done"
  | "expired"
  | "failed"
  | "queued"
  | "running"
  | "unknown";

// A page of 20 stored searches shouldn't land on the backend as 20 requests
// at once.
const CONCURRENCY = 3;

/**
 * Ask Galaxy where one job stands.
 * @param jobId - Galaxy job id.
 * @returns Its status.
 */
async function checkJob(jobId: string): Promise<SearchStatus> {
  try {
    const status = await ky
      .get(`${API_BASE_URL}/galaxy/jobs/${encodeURIComponent(jobId)}/status`, {
        credentials: "include",
        retry: 0,
        timeout: 30000,
      })
      .json<{ is_complete: boolean; is_successful: boolean; state?: string }>();
    // Waiting for a Vista node and searching are different stories to the
    // reader: one can take hours on a busy day, the other a few minutes.
    if (!status.is_complete)
      return status.state === "new" || status.state === "queued"
        ? "queued"
        : "running";
    return status.is_successful ? "done" : "failed";
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404)
      return "expired";
    return "unknown";
  }
}

/**
 * Check each stored search's job once, a few at a time.
 * @param jobIds - The jobs to check, newest first.
 * @returns Each job's status, "checking" until its answer lands.
 */
export function useSearchStatuses(
  jobIds: string[]
): Record<string, SearchStatus> {
  const [statuses, setStatuses] = useState<Record<string, SearchStatus>>({});
  const key = jobIds.join(",");

  useEffect(() => {
    let cancelled = false;
    const queue = key ? key.split(",") : [];

    /**
     * Take jobs off the queue until it is empty.
     */
    const work = async (): Promise<void> => {
      for (let jobId = queue.shift(); jobId; jobId = queue.shift()) {
        const status = await checkJob(jobId);
        if (cancelled) return;
        setStatuses((prev) => ({ ...prev, [jobId]: status }));
      }
    };

    for (let i = 0; i < CONCURRENCY; i++) work().catch(() => undefined);
    return (): void => {
      cancelled = true;
    };
  }, [key]);

  return Object.fromEntries(
    jobIds.map((jobId) => [jobId, statuses[jobId] ?? "checking"])
  );
}
