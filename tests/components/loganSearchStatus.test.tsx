import { LoganSearchForm } from "@brc/components/LoganSearch/LoganSearchForm/loganSearchForm";
import { LoganSearchStatus } from "@brc/components/LoganSearch/LoganSearchStatus/loganSearchStatus";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { render, screen } from "@testing-library/react";

// The hook module imports ky, which ships ESM only and Jest cannot parse.
jest.mock("ky", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: (): { isAuthenticated: boolean } => ({ isAuthenticated: false }),
}));

type Search = ReturnType<typeof useKmindexSearch>;

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
