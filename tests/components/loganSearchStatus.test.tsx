import { LoganSearchForm } from "@repo/shared/components/LoganSearch/LoganSearchForm/loganSearchForm";
import { LoganSearchStatus } from "@repo/shared/components/LoganSearch/LoganSearchStatus/loganSearchStatus";
import {
  busyNotice,
  describeQueue,
  formatWait,
} from "@repo/shared/components/LoganSearch/LoganSearchStatus/queueNote";
import {
  type KmindexQueue,
  useKmindexQueue,
} from "@repo/shared/hooks/useKmindexQueue";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// The search hook module imports ky, which ships ESM only and Jest cannot parse.
jest.mock("ky", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: jest.fn(),
}));
// The real hook imports ky, which Jest can't parse; the polling itself is
// trivial, and what matters here is what the card says with a reading.
jest.mock("@repo/shared/hooks/useKmindexQueue", () => ({
  useKmindexQueue: jest.fn(),
}));

const BACKED_UP: KmindexQueue = {
  as_of: "2026-10-15T14:18:07+00:00",
  oldest_waiting_minutes: 140.3,
  recent_searches: 4,
  recent_wait_minutes: 12.4,
  recent_wait_p90_minutes: 51,
  running: 1,
  waiting: 5,
  window_minutes: 120,
};

type Search = ReturnType<typeof useKmindexSearch>;

/**
 * Render the card for a job in the given state.
 * @param state - Galaxy's job state.
 * @param extra - Other search fields to set.
 */
function renderStatus(state: string, extra: Partial<Search> = {}): void {
  const search = {
    error: null,
    identity: "service",
    isLoadingResults: false,
    jobId: "96be5feb27d81bbb",
    jobStatus: { state },
    results: null,
    ...extra,
  } as unknown as Search;
  render(<LoganSearchStatus search={search} />);
}

beforeEach(() => {
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
  (useKmindexQueue as jest.Mock).mockReturnValue(BACKED_UP);
});

describe("formatWait", () => {
  test("says waits the way a person would", () => {
    expect(formatWait(0.3)).toBe("under a minute");
    expect(formatWait(12.4)).toBe("12 min");
    expect(formatWait(60)).toBe("1 h");
    expect(formatWait(140.3)).toBe("2 h 20 min");
  });
});

describe("describeQueue", () => {
  test("says how long the oldest search has waited when that's the longer", () => {
    expect(describeQueue(BACKED_UP)).toBe(
      "Demand is quite high right now; the oldest search in line has been waiting about 2 h 20 min."
    );
    expect(busyNotice(BACKED_UP)).toBe(
      "Heads up, demand is quite high right now. The oldest search in line has been waiting about 2 h 20 min."
    );
  });

  test("says how long recent searches waited when that's the longer", () => {
    const drained = { ...BACKED_UP, oldest_waiting_minutes: null, waiting: 0 };
    expect(describeQueue(drained)).toBe(
      "Demand is quite high right now; recent searches have waited about 12 min to start."
    );
    expect(busyNotice(drained)).toBe(
      "Heads up, demand is quite high right now. Recent searches have waited about 12 min to start."
    );
  });

  test("credits recent searches when the two figures tie", () => {
    expect(describeQueue({ ...BACKED_UP, oldest_waiting_minutes: 12.4 })).toBe(
      "Demand is quite high right now; recent searches have waited about 12 min to start."
    );
  });

  test("goes by the longer of the backlog and the recent wait", () => {
    // Recent waits only count finished searches, so a backlog building right
    // now shows up in the oldest wait first -- and the other way round once
    // it drains.
    expect(describeQueue({ ...BACKED_UP, oldest_waiting_minutes: 3 })).toBe(
      "Demand is quite high right now; recent searches have waited about 12 min to start."
    );
  });

  test("says nothing when the queue is moving", () => {
    expect(
      describeQueue({
        ...BACKED_UP,
        oldest_waiting_minutes: 4,
        recent_wait_minutes: 2,
      })
    ).toBeNull();
    expect(describeQueue(null)).toBeNull();
  });

  test("never names the cluster or who runs it", () => {
    const text = `${describeQueue(BACKED_UP)} ${busyNotice(BACKED_UP)}`;
    expect(text).not.toMatch(/Vista|TACC|cluster/);
  });
});

describe("LoganSearchStatus queue note", () => {
  test("tells a queued search what it's waiting behind", () => {
    renderStatus("queued");

    expect(useKmindexQueue).toHaveBeenLastCalledWith(true);
    expect(screen.getByText(/Demand is quite high right now/)).toBeTruthy();
    expect(screen.getByText("Queued")).toBeTruthy();
    expect(screen.getByText(/A long wait isn.t an error/)).toBeTruthy();
  });

  test("stops asking once the search is running", () => {
    renderStatus("running");

    expect(useKmindexQueue).toHaveBeenLastCalledWith(false);
    expect(screen.queryByText(/Demand is quite high/)).toBeNull();
  });

  test("still reassures before the first reading lands", () => {
    (useKmindexQueue as jest.Mock).mockReturnValue(null);

    renderStatus("new");

    expect(screen.getByText(/A long wait isn.t an error/)).toBeTruthy();
    expect(screen.queryByText(/Demand is quite high/)).toBeNull();
  });
});

const JOB_ID = "dee9dc267ca2a401";
const WARNING = "Failed to get job status: down -- still trying.";

/**
 * A search that is running while its status requests keep failing.
 * @returns The stubbed hook return.
 */
function unreachable(): Search {
  return {
    error: null,
    goToPage: jest.fn(),
    identity: null,
    indexes: ["GENOMIC_BCT"],
    isLoadingIndexes: false,
    isLoadingResults: false,
    isSubmitting: false,
    jobId: JOB_ID,
    jobStatus: {
      is_complete: false,
      is_successful: false,
      job_id: JOB_ID,
      state: "running",
    },
    pollWarning: WARNING,
    reset: jest.fn(),
    results: null,
    submit: jest.fn(),
  } as unknown as Search;
}

describe("a search whose status requests keep failing", () => {
  test("shows the warning beside the job's last known state", () => {
    render(<LoganSearchStatus search={unreachable()} />);

    expect(screen.getByText(WARNING)).toBeTruthy();
    expect(screen.getByText(`Job ${JOB_ID}`)).toBeTruthy();
    expect(screen.getByText("Searching the index")).toBeTruthy();
  });

  test("still reads as running, so the form cannot be resubmitted over it", () => {
    render(<LoganSearchForm search={unreachable()} />);

    expect(screen.getByRole("button", { name: "Searching..." })).toBeTruthy();
  });
});
