import { useUserResource } from "@repo/shared/hooks/UseUserResource/hook";
import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";
import { useChatHistory } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/hooks/UseChatHistory/hook";
import type { ChatHistoryProps } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/types";
import type { LastSave } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
import { renderHook } from "@testing-library/react";

jest.mock("@repo/shared/hooks/UseUserResource/hook", () => ({
  useUserResource: jest.fn(),
}));
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: { getSavedAnalyses: jest.fn() },
}));
jest.mock("@repo/shared/views/AssistantView/utils", () => ({
  openSavedAnalysis: jest.fn(),
}));
jest.mock("next/router", () => ({
  __esModule: true,
  default: { query: {} },
}));

const mockUseUserResource = useUserResource as jest.MockedFunction<
  typeof useUserResource
>;
const reload = jest.fn().mockResolvedValue(undefined);

const SAVED_SESSION = "saved1111222233334444555566667777";
const NEW_SESSION = "new11112222333344445555666677778";

/**
 * A saved conversation pointing at the given live session.
 * @param sourceSession - Live session the saved conversation points at
 * @returns The saved conversation summary
 */
function savedAnalysis(sourceSession: string): SavedAnalysisSummary {
  return {
    created_at: "2026-10-01T00:00:00Z",
    id: `analysis-${sourceSession}`,
    source_session: sourceSession,
    title: "Plasmodium run",
    updated_at: "2026-10-01T00:00:00Z",
  };
}

/**
 * Put the history in a given loaded state.
 * @param items - Saved conversations the list has loaded
 */
function loaded(items: SavedAnalysisSummary[]): void {
  mockUseUserResource.mockReturnValue({
    error: null,
    isLoading: false,
    items,
    reload,
    setItems: jest.fn(),
  });
}

/**
 * Hook props with no save yet and nothing busy.
 * @param overrides - Props to change
 * @returns The hook props
 */
function props(overrides: Partial<ChatHistoryProps> = {}): ChatHistoryProps {
  return {
    disabled: false,
    lastSave: null,
    onOpeningChange: jest.fn(),
    onRetryRestore: jest.fn(),
    sessionId: null,
    ...overrides,
  };
}

describe("useChatHistory refresh on save", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("a first save for a conversation missing from the list reloads it once", () => {
    // The row doesn't exist until the first save creates it, so the list has
    // to fetch it -- once, not again while the same save is still the latest.
    loaded([savedAnalysis(SAVED_SESSION)]);
    const { rerender } = renderHook(
      (p: ChatHistoryProps) => useChatHistory(p),
      {
        initialProps: props(),
      }
    );
    expect(reload).not.toHaveBeenCalled();

    const lastSave: LastSave = { sessionId: NEW_SESSION };
    rerender(props({ lastSave, sessionId: NEW_SESSION }));
    expect(reload).toHaveBeenCalledTimes(1);

    // The list changes as the reload lands; the same save must not reload again.
    loaded([savedAnalysis(SAVED_SESSION), savedAnalysis("other")]);
    rerender(props({ lastSave, sessionId: NEW_SESSION }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test("a later save for a conversation already in the list doesn't reload", () => {
    // Later saves change nothing the list shows: the title is fixed when the
    // row is created, and rows are ordered by when each conversation started.
    loaded([savedAnalysis(SAVED_SESSION)]);
    const { rerender } = renderHook(
      (p: ChatHistoryProps) => useChatHistory(p),
      {
        initialProps: props({ sessionId: SAVED_SESSION }),
      }
    );

    rerender(
      props({
        lastSave: { sessionId: SAVED_SESSION },
        sessionId: SAVED_SESSION,
      })
    );
    rerender(
      props({
        lastSave: { sessionId: SAVED_SESSION },
        sessionId: SAVED_SESSION,
      })
    );

    expect(reload).not.toHaveBeenCalled();
  });

  test("a save that lands after switching conversations reloads for the one saved", () => {
    // The conversation on screen is already in the list, but the save is for
    // the one left behind -- whose first save still has to join the list.
    loaded([savedAnalysis(SAVED_SESSION)]);
    const { rerender } = renderHook(
      (p: ChatHistoryProps) => useChatHistory(p),
      {
        initialProps: props({ sessionId: SAVED_SESSION }),
      }
    );

    rerender(
      props({ lastSave: { sessionId: NEW_SESSION }, sessionId: SAVED_SESSION })
    );

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
