import { createLoganTheme } from "@logan/theme/theme";
import { LoganSearchSiteView } from "@logan/views/LoganSearchSiteView/loganSearchSiteView";
import { ThemeProvider } from "@mui/material";
import {
  RECENT_SEARCHES_KEY,
  readRecentSearches,
} from "@repo/shared/components/LoganSearch/LoganSearchHistory/recentSearches";
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

const mockRouter = {
  push: jest.fn(() => Promise.resolve(true)),
  replace: jest.fn(() => Promise.resolve(true)),
};
jest.mock("next/router", () => ({
  useRouter: (): typeof mockRouter => mockRouter,
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

/**
 * Render the page inside the site theme, which the hero's breakpoints read.
 */
function renderPage(): void {
  render(
    <ThemeProvider theme={createLoganTheme()}>
      <LoganSearchSiteView />
    </ThemeProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  mockKy.get.mockImplementation((url: string) => {
    if (url.includes("/kmindex/indexes"))
      return jsonOf({ count: 2, indexes: ["GENOMIC_BCT", "GENOMIC_INV"] });
    return jsonOf({ is_complete: false, job_id: "x", state: "queued" });
  });
});

describe("LoganSearchSiteView", () => {
  test("sends an old ?job= link on to the results page, filters and all", async () => {
    window.history.replaceState(null, "", "/?job=abc123&f.country=Kenya");

    renderPage();

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/results?job=abc123&f.country=Kenya"
      )
    );
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  test("fills the form from a search this browser ran", async () => {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify([
        {
          indexes: ["GENOMIC_BCT"],
          jobId: "j1",
          queryName: "mine",
          sequence: ">mine\nACGTACGTAC\n",
          submittedAt: "2026-10-12T09:00:00.000Z",
          threshold: 0.8,
        },
      ])
    );
    window.history.replaceState(null, "", "/?edit=j1");

    renderPage();

    expect(await screen.findByRole("textbox")).toHaveValue(
      ">mine\nACGTACGTAC\n"
    );
    expect(screen.getByText("0.80")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText(/GENOMIC_BCT/)).toBeInTheDocument()
    );
  });

  test("starts from the sample query when the edited search isn't stored", async () => {
    window.history.replaceState(null, "", "/?edit=gone");

    renderPage();

    const textbox = await screen.findByRole("textbox");
    expect((textbox as HTMLTextAreaElement).value).toMatch(
      /^>Plasmodium_falciparum_18S/
    );
  });

  test("records a submitted search and goes to its results", async () => {
    mockKy.post.mockReturnValue(jsonOf({ job_id: "new1" }));

    renderPage();
    fireEvent.change(await screen.findByRole("textbox"), {
      target: { value: ">q\nACGTACGTACGTACGTACGT" },
    });
    const button = screen.getByRole("button", { name: "Search Logan" });
    await waitFor(() => expect(button).toHaveProperty("disabled", false));
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith("/results?job=new1")
    );
    // Back from the results returns to the form as submitted.
    expect(mockRouter.replace).toHaveBeenCalledWith("/?edit=new1", undefined, {
      shallow: true,
    });
    const stored = readRecentSearches();
    expect(stored.status === "ok" && stored.searches[0]).toMatchObject({
      jobId: "new1",
      sequence: ">q\nACGTACGTACGTACGTACGT",
    });
  });
});
