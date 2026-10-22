import { API_BASE_URL } from "@repo/shared/config/api";
import ky, { HTTPError } from "ky";
import { useEffect, useRef, useState } from "react";

// Where a stored search stands, as of its latest status check.
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

// A job still on its way is checked again this often, so Queued and Running
// move on without a reload. The backend caches a live status for less than
// this, so every recheck is a fresh answer.
const RECHECK_MS = 60_000;

// What a later check could still change: work in progress, and a check that
// failed for a reason other than the job being gone.
const UNSETTLED = new Set<SearchStatus>(["queued", "running", "unknown"]);

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
 * Check each stored search's job, a few at a time, then keep rechecking the
 * ones still in progress about once a minute while the page is visible.
 * @param jobIds - The jobs to check, newest first.
 * @returns Each job's status, "checking" until its first answer lands.
 */
export function useSearchStatuses(
  jobIds: string[]
): Record<string, SearchStatus> {
  const [statuses, setStatuses] = useState<Record<string, SearchStatus>>({});
  // The interval reads the latest answers without restarting on each one.
  const latest = useRef(statuses);
  latest.current = statuses;
  const key = jobIds.join(",");

  useEffect(() => {
    let cancelled = false;
    let checking = false;

    /**
     * Check jobs a few at a time until all have answered.
     * @param ids - The jobs to check.
     */
    const check = async (ids: string[]): Promise<void> => {
      const queue = [...ids];
      const work = async (): Promise<void> => {
        for (let jobId = queue.shift(); jobId; jobId = queue.shift()) {
          const status = await checkJob(jobId);
          if (cancelled) return;
          setStatuses((prev) => ({ ...prev, [jobId]: status }));
        }
      };
      checking = true;
      await Promise.all(
        Array.from({ length: CONCURRENCY }, () => work().catch(() => undefined))
      );
      checking = false;
    };

    const ids = key ? key.split(",") : [];
    check(ids).catch(() => undefined);
    const timer = setInterval(() => {
      // A pass still running, or a tab nobody is looking at, can wait.
      if (checking || document.hidden) return;
      const pending = ids.filter((jobId) =>
        UNSETTLED.has(latest.current[jobId] ?? "checking")
      );
      if (pending.length) check(pending).catch(() => undefined);
    }, RECHECK_MS);
    return (): void => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [key]);

  return Object.fromEntries(
    jobIds.map((jobId) => [jobId, statuses[jobId] ?? "checking"])
  );
}
