import { withMySearches } from "@logan/config/navigation";
import { createLoganTheme } from "@logan/theme/theme";
import { MySearchesView } from "@logan/views/MySearchesView/mySearchesView";
import { ThemeProvider } from "@mui/material";
import {
  RECENT_SEARCHES_KEY,
  readRecentSearches,
  withSearchMatches,
  type RecentSearch,
} from "@repo/shared/components/LoganSearch/LoganSearchHistory/recentSearches";
import { type AppSiteConfig } from "@repo/shared/config/types";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ky from "ky";

jest.mock("ky", () => {
  class StubHTTPError extends Error {
    response: { status: number };
    constructor(status: number) {
      super(`HTTP ${status}`);
      this.response = { status };
    }
  }
  return {
    HTTPError: StubHTTPError,
    TimeoutError: class extends Error {},
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
  };
});

const mockKy = ky as unknown as { get: jest.Mock };
const { HTTPError } = jest.requireMock("ky") as {
  HTTPError: new (status: number) => Error;
};

/**
 * A stored search.
 * @param jobId - Its job id.
 * @param overrides - Fields to change.
 * @returns The entry.
 */
function entry(
  jobId: string,
  overrides: Partial<RecentSearch> = {}
): RecentSearch {
  return {
    indexes: ["GENOMIC_INV"],
    jobId,
    queryName: `query_${jobId}`,
    sequence: ">q\nACGT\n",
    submittedAt: "2026-10-12T09:00:00.000Z",
    threshold: 0.5,
    ...overrides,
  };
}

/**
 * Answer a status request the way Galaxy would for each job.
 * @param url - Requested URL.
 * @returns A ky-like response.
 */
function galaxy(url: string): { json: () => Promise<unknown> } {
  const answer = (): unknown => {
    if (url.includes("/kmindex/indexes")) return { indexes: ["GENOMIC_INV"] };
    if (url.includes("/done/"))
      return { is_complete: true, is_successful: true };
    if (url.includes("/running/"))
      return { is_complete: false, is_successful: false };
    if (url.includes("/broke/"))
      return { is_complete: true, is_successful: false };
    throw new HTTPError(404);
  };
  return {
    json: (): Promise<unknown> => {
      try {
        return Promise.resolve(answer());
      } catch (error) {
        return Promise.reject(error);
      }
    },
  };
}

/**
 * Render the page inside the site theme.
 */
function renderPage(): void {
  render(
    <ThemeProvider theme={createLoganTheme()}>
      <MySearchesView />
    </ThemeProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockKy.get.mockImplementation(galaxy);
});

describe("MySearchesView", () => {
  test("lists each search with where its job stands", async () => {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify([
        entry("running"),
        entry("done", { totalMatches: 17629 }),
        entry("broke"),
        entry("gone"),
      ])
    );

    renderPage();

    const row = (jobId: string): HTMLElement =>
      screen.getByText(`query_${jobId}`).closest("li") as HTMLElement;
    expect(await within(row("running")).findByText("Running")).toBeTruthy();
    expect(await within(row("done")).findByText("Done")).toBeTruthy();
    expect(within(row("done")).getByText("17,629")).toBeTruthy();
    expect(
      within(row("done")).getByRole("link", { name: "query_done" })
    ).toHaveAttribute("href", "/results?job=done");
    expect(await within(row("broke")).findByText("Failed")).toBeTruthy();
    expect(await within(row("gone")).findByText("Expired")).toBeTruthy();
    // Nothing to open, but the query is still here to run again.
    expect(
      within(row("gone")).queryByRole("link", { name: "query_gone" })
    ).toBeNull();
    expect(
      within(row("gone")).getByRole("link", { name: "Run it again" })
    ).toHaveAttribute("href", "/?edit=gone");
  });

  test("says how to start when there is nothing stored", () => {
    renderPage();

    expect(screen.getByText("No searches yet")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Start a search" })
    ).toHaveAttribute("href", "/");
  });

  test("clears the list", async () => {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify([entry("done")])
    );
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Clear all" }));

    expect(screen.getByText("No searches yet")).toBeTruthy();
    expect(readRecentSearches()).toEqual({ searches: [], status: "ok" });
  });
});

describe("withSearchMatches", () => {
  test("notes a count on the one search, and leaves an unchanged list alone", () => {
    const list = [entry("a"), entry("b")];
    const next = withSearchMatches(list, "b", 12);
    expect(next[1].totalMatches).toBe(12);
    expect(next[0]).toBe(list[0]);
    expect(withSearchMatches(next, "b", 12)).toBe(next);
    expect(withSearchMatches(list, "nope", 3)).toBe(list);
  });
});

describe("withMySearches", () => {
  const CONFIG = {
    layout: {
      header: {
        navigation: [
          undefined,
          [
            { label: "Search", url: "/" },
            { label: "Learn", url: "/learn" },
          ],
          undefined,
        ],
      },
    },
  } as unknown as AppSiteConfig;

  test("leaves the header alone with nothing stored", () => {
    expect(withMySearches(CONFIG, 0)).toBe(CONFIG);
  });

  test("adds the link before Learn once there is a search", () => {
    const urls = withMySearches(CONFIG, 3).layout.header.navigation?.[1]?.map(
      ({ url }) => url
    );
    expect(urls).toEqual(["/", "/my-searches", "/learn"]);
  });
});
