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
  test("says how long recent searches waited when demand is high", () => {
    expect(describeQueue(BACKED_UP)).toBe(
      "Demand is quite high right now; recent searches have waited about 2 h 20 min to start."
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
