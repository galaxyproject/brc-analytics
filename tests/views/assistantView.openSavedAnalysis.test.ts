import { apiClient } from "@repo/shared/services/api-client/api-client";
import { openSavedAnalysis } from "@repo/shared/views/AssistantView/utils";

jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: {
    openSavedAnalysis: jest.fn(),
  },
}));

const push = jest.fn();
const replace = jest.fn();
jest.mock("next/router", () => ({
  __esModule: true,
  default: {
    push: (...args: unknown[]): unknown => push(...args),
    replace: (...args: unknown[]): unknown => replace(...args),
  },
}));

const mockClient = apiClient as jest.Mocked<typeof apiClient>;

const LIVE_SESSION_ID = "live1111222233334444555566667777";

describe("openSavedAnalysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.openSavedAnalysis.mockResolvedValue({
      session_id: LIVE_SESSION_ID,
    } as Awaited<ReturnType<typeof mockClient.openSavedAnalysis>>);
  });

  test("opens the restored session on the assistant page", async () => {
    push.mockResolvedValue(true);

    await expect(openSavedAnalysis("analysis-1")).resolves.toBe(
      LIVE_SESSION_ID
    );

    expect(mockClient.openSavedAnalysis).toHaveBeenCalledWith("analysis-1");
    expect(push).toHaveBeenCalledWith({
      pathname: "/assistant",
      query: { sessionId: LIVE_SESSION_ID },
    });
  });

  test("replaces the history entry when asked, rather than pushing one", async () => {
    // Opened from the assistant page itself: the cookie vouches for one
    // conversation at a time, so an entry for the one left behind could not be
    // restored by Back.
    replace.mockResolvedValue(true);

    await openSavedAnalysis("analysis-1", { replace: true });

    expect(replace).toHaveBeenCalledWith(
      { pathname: "/assistant", query: { sessionId: LIVE_SESSION_ID } },
      undefined,
      { shallow: true }
    );
    expect(push).not.toHaveBeenCalled();
  });

  test("a navigation failure is passed on", async () => {
    const error = new Error("boom");
    push.mockRejectedValue(error);

    await expect(openSavedAnalysis("analysis-1")).rejects.toBe(error);
  });

  test("a failed open does not navigate", async () => {
    mockClient.openSavedAnalysis.mockRejectedValue(new Error("gone"));

    await expect(openSavedAnalysis("analysis-1")).rejects.toThrow("gone");
    expect(push).not.toHaveBeenCalled();
  });
});
