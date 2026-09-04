import { LoganSearchAnalyze } from "@brc/components/LoganSearch/LoganSearchAnalyze/loganSearchAnalyze";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { render, screen } from "@testing-library/react";

jest.mock("ky", () => ({ __esModule: true, default: {} }));

type Search = ReturnType<typeof useKmindexSearch>;

/**
 * A search-hook stub carrying only what the card reads.
 * @param overrides - Fields to set on top of an idle search.
 * @returns The stubbed hook return.
 */
function search(overrides: Partial<Search>): Search {
  return {
    error: null,
    goToPage: jest.fn(),
    indexes: [],
    isLoadingIndexes: false,
    isLoadingResults: false,
    isSubmitting: false,
    jobId: null,
    jobStatus: null,
    reset: jest.fn(),
    results: null,
    submit: jest.fn(),
    ...overrides,
  } as unknown as Search;
}

describe("LoganSearchAnalyze", () => {
  test("renders nothing before results", () => {
    const { container } = render(
      <LoganSearchAnalyze search={search({ jobId: "fe6f66a714dcbec8" })} />
    );
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing without a job id", () => {
    const { container } = render(
      <LoganSearchAnalyze
        search={search({
          results: { total_matches: 17629 } as Search["results"],
        })}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  test("links to the assistant with the job id once results are in", () => {
    render(
      <LoganSearchAnalyze
        search={search({
          jobId: "fe6f66a714dcbec8",
          results: { total_matches: 17629 } as Search["results"],
        })}
      />
    );
    expect(
      screen
        .getByRole("link", { name: /ask the assistant/i })
        .getAttribute("href")
    ).toBe("/assistant?loganJob=fe6f66a714dcbec8");
  });
});
