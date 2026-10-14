import type { OpenAnalysisHandlers } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/hooks/UseChatHistory/types";
import { openAnalysis } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/hooks/UseChatHistory/utils";
import { openSavedAnalysis } from "@repo/shared/views/AssistantView/utils";

jest.mock("@repo/shared/views/AssistantView/utils", () => ({
  openSavedAnalysis: jest.fn(),
}));
let mockQuery: Record<string, string> = {};
jest.mock("next/router", () => ({
  __esModule: true,
  default: {
    get query(): Record<string, string> {
      return mockQuery;
    },
  },
}));

const mockOpenSavedAnalysis = openSavedAnalysis as jest.MockedFunction<
  typeof openSavedAnalysis
>;

const SHOWN_SESSION = "shown111122223333444455556666777";
const OPENED_SESSION = "opened11112222333344445555666677";

/**
 * Handlers for an open, each a spy.
 * @returns The handlers.
 */
function handlers(): jest.Mocked<OpenAnalysisHandlers> {
  return {
    onOpened: jest.fn(),
    onOpeningChange: jest.fn(),
    onRetryRestore: jest.fn(),
    setOpenError: jest.fn(),
  } as jest.Mocked<OpenAnalysisHandlers>;
}

// onOpened moves the conversation panel's key, dropping the unsent draft, so
// it must fire only when a different conversation is reached.
describe("openAnalysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = { sessionId: SHOWN_SESSION };
  });

  test("reports a different conversation reached", async () => {
    mockOpenSavedAnalysis.mockResolvedValue(OPENED_SESSION);
    const h = handlers();

    await openAnalysis("analysis-1", SHOWN_SESSION, h);

    expect(h.onOpened).toHaveBeenCalledTimes(1);
    expect(h.onRetryRestore).not.toHaveBeenCalled();
    expect(h.onOpeningChange.mock.calls).toEqual([[true], [false]]);
  });

  test("doesn't report an open that failed", async () => {
    mockOpenSavedAnalysis.mockRejectedValue(new Error("500"));
    const h = handlers();

    await openAnalysis("analysis-1", SHOWN_SESSION, h);

    expect(h.onOpened).not.toHaveBeenCalled();
    expect(h.setOpenError).toHaveBeenCalledWith({ sessionId: SHOWN_SESSION });
  });

  test("doesn't report an open that a later navigation overtook", async () => {
    mockOpenSavedAnalysis.mockResolvedValue(null);
    const h = handlers();

    await openAnalysis("analysis-1", SHOWN_SESSION, h);

    expect(h.onOpened).not.toHaveBeenCalled();
  });

  test("doesn't report an open of the conversation already showing", async () => {
    // Restored from localStorage, so the URL names no session.
    mockQuery = {};
    mockOpenSavedAnalysis.mockResolvedValue(SHOWN_SESSION);
    const h = handlers();

    await openAnalysis("analysis-1", SHOWN_SESSION, h);

    expect(h.onOpened).not.toHaveBeenCalled();
  });

  test("retries rather than reports an open of the conversation already named", async () => {
    mockOpenSavedAnalysis.mockResolvedValue(SHOWN_SESSION);
    const h = handlers();

    await openAnalysis("analysis-1", SHOWN_SESSION, h);

    expect(h.onRetryRestore).toHaveBeenCalledTimes(1);
    expect(h.onOpened).not.toHaveBeenCalled();
  });
});
