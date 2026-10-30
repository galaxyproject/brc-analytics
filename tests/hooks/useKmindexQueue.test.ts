import {
  type KmindexQueue,
  useKmindexQueue,
} from "@repo/shared/hooks/useKmindexQueue";
import { act, renderHook, waitFor } from "@testing-library/react";
import ky from "ky";

jest.mock("ky", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockGet = (ky as unknown as { get: jest.Mock }).get;

const QUEUE: KmindexQueue = {
  as_of: "2026-10-15T14:18:07+00:00",
  oldest_waiting_minutes: 140.3,
  recent_searches: 4,
  recent_wait_minutes: 12.4,
  recent_wait_p90_minutes: 51,
  running: 1,
  waiting: 5,
  window_minutes: 120,
};

/**
 * Make the tab visible or hidden, as the browser would.
 * @param hidden - Whether nobody can see the page.
 */
function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  jest.useFakeTimers();
  mockGet.mockReset();
  mockGet.mockReturnValue({ json: () => Promise.resolve(QUEUE) });
  setHidden(false);
});

afterEach(() => {
  jest.useRealTimers();
});

test("two components on one page share one poll", async () => {
  const form = renderHook(() => useKmindexQueue(true));
  const status = renderHook(() => useKmindexQueue(true));

  await waitFor(() => expect(form.result.current).toEqual(QUEUE));
  expect(status.result.current).toEqual(QUEUE);
  expect(mockGet).toHaveBeenCalledTimes(1);

  await act(async () => {
    await jest.advanceTimersByTimeAsync(60_000);
  });
  expect(mockGet).toHaveBeenCalledTimes(2);

  form.unmount();
  status.unmount();
});

test("skips a hidden tab and catches up when it comes back", async () => {
  const { unmount } = renderHook(() => useKmindexQueue(true));
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

  setHidden(true);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(120_000);
  });
  expect(mockGet).toHaveBeenCalledTimes(1);

  act(() => setHidden(false));
  expect(mockGet).toHaveBeenCalledTimes(2);

  unmount();
});

test("stops with the last subscriber, and starts fresh after", async () => {
  const first = renderHook(() => useKmindexQueue(true));
  await waitFor(() => expect(first.result.current).toEqual(QUEUE));
  first.unmount();

  await act(async () => {
    await jest.advanceTimersByTimeAsync(180_000);
  });
  expect(mockGet).toHaveBeenCalledTimes(1);

  // A later wait doesn't inherit the old reading; it asks again.
  mockGet.mockReturnValue({ json: () => new Promise(() => undefined) });
  const second = renderHook(() => useKmindexQueue(true));
  expect(second.result.current).toBeNull();
  expect(mockGet).toHaveBeenCalledTimes(2);
  second.unmount();
});

test("asks nothing while inactive", () => {
  const { result, unmount } = renderHook(() => useKmindexQueue(false));

  expect(result.current).toBeNull();
  expect(mockGet).not.toHaveBeenCalled();
  unmount();
});
