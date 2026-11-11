import type { OpenAnalysisHandlers } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/hooks/UseChatHistory/types";
import { openAnalysis } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/hooks/UseChatHistory/utils";

const SHOWN_SESSION = "shown111122223333444455556666777";

/**
 * Handlers for an open, each a spy, with an open that succeeds.
 * @returns The handlers.
 */
function handlers(): jest.Mocked<OpenAnalysisHandlers> {
  return {
    onOpenConversation: jest.fn().mockResolvedValue(true),
    setOpenError: jest.fn(),
  };
}

describe("openAnalysis", () => {
  test("opens the conversation through the chat and clears an earlier failure", async () => {
    const h = handlers();

    await openAnalysis("analysis-1", SHOWN_SESSION, h);

    expect(h.onOpenConversation).toHaveBeenCalledWith("analysis-1");
    expect(h.setOpenError).toHaveBeenCalledTimes(1);
    expect(h.setOpenError).toHaveBeenCalledWith(null);
  });

  test("reports a failed open against the conversation showing", async () => {
    const h = handlers();
    h.onOpenConversation.mockRejectedValue(new Error("500"));

    await openAnalysis("analysis-1", SHOWN_SESSION, h);

    expect(h.setOpenError).toHaveBeenLastCalledWith({
      sessionId: SHOWN_SESSION,
    });
  });
});
