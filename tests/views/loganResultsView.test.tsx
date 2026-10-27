import { LoganResultsView } from "@logan/views/LoganResultsView/loganResultsView";
import { RECENT_SEARCHES_KEY } from "@repo/shared/components/LoganSearch/LoganSearchHistory/recentSearches";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ky from "ky";

jest.mock("ky", () => {
  class StubHTTPError extends Error {}
  class StubTimeoutError extends Error {}
  return {
    HTTPError: StubHTTPError,
    TimeoutError: StubTimeoutError,
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
  };
});

jest.mock("vega-embed", () => ({
  __esModule: true,
  default: jest.fn(async () => ({
    finalize: jest.fn(),
    view: { addEventListener: jest.fn() },
  })),
}));

const mockKy = ky as unknown as { get: jest.Mock; post: jest.Mock };

/**
 * A ky-like thenable whose .json() resolves to `value`.
 * @param value - Payload.
 * @returns An object exposing json().
 */
function jsonOf(value: unknown): { json: () => Promise<unknown> } {
  return { json: (): Promise<unknown> => Promise.resolve(value) };
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockKy.get.mockImplementation((url: string) => {
    if (url.includes("/kmindex/indexes"))
      return jsonOf({ count: 1, indexes: ["GENOMIC_INV"] });
    return jsonOf({ is_complete: false, job_id: "j1", state: "running" });
  });
});

describe("LoganResultsView", () => {
  test("heads a running search with its query, not the form", async () => {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify([
        {
          indexes: ["GENOMIC_INV"],
          jobId: "j1",
          queryName: "mine",
          sequence: ">mine\nACGT\n",
          submittedAt: "2026-10-12T09:00:00.000Z",
          threshold: 0.8,
        },
      ])
    );
    window.history.replaceState(null, "", "/results?job=j1");

    render(<LoganResultsView />);

    expect(await screen.findByRole("heading", { name: "mine" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Edit search" })).toHaveAttribute(
      "href",
      "/?edit=j1"
    );
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  test("says there is nothing to show without a job", async () => {
    window.history.replaceState(null, "", "/results");

    render(<LoganResultsView />);

    expect(await screen.findByText("No search to show")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Start a search" })
    ).toHaveAttribute("href", "/");
  });
});
