import { useUserResource } from "@repo/shared/hooks/UseUserResource/hook";
import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";
import { useChatHistory } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/hooks/UseChatHistory/hook";
import { buildHistoryItems } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/hooks/UseChatHistory/utils";
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

const SAVED_ID = "analysis-saved";
const NEW_ID = "analysis-new";

/**
 * A saved conversation with the given id.
 * @param id - Saved conversation id
 * @returns The saved conversation summary
 */
function savedAnalysis(id: string): SavedAnalysisSummary {
  return {
    created_at: "2026-10-01T00:00:00Z",
    id,
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
    onOpened: jest.fn(),
    onOpeningChange: jest.fn(),
    onRetryRestore: jest.fn(),
    savedAnalysisId: null,
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
    loaded([savedAnalysis(SAVED_ID)]);
    const { rerender } = renderHook(
      (p: ChatHistoryProps) => useChatHistory(p),
      {
        initialProps: props(),
      }
    );
    expect(reload).not.toHaveBeenCalled();

    const lastSave: LastSave = { savedAnalysisId: NEW_ID };
    rerender(props({ lastSave, savedAnalysisId: NEW_ID }));
    expect(reload).toHaveBeenCalledTimes(1);

    // The list changes as the reload lands; the same save must not reload again.
    loaded([savedAnalysis(SAVED_ID), savedAnalysis("other")]);
    rerender(props({ lastSave, savedAnalysisId: NEW_ID }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test("a later save for a conversation already in the list doesn't reload", () => {
    // Later saves change nothing the list shows: the title is fixed when the
    // row is created, and rows are ordered by when each conversation started.
    loaded([savedAnalysis(SAVED_ID)]);
    const { rerender } = renderHook(
      (p: ChatHistoryProps) => useChatHistory(p),
      {
        initialProps: props({ savedAnalysisId: SAVED_ID }),
      }
    );

    rerender(
      props({
        lastSave: { savedAnalysisId: SAVED_ID },
        savedAnalysisId: SAVED_ID,
      })
    );
    rerender(
      props({
        lastSave: { savedAnalysisId: SAVED_ID },
        savedAnalysisId: SAVED_ID,
      })
    );

    expect(reload).not.toHaveBeenCalled();
  });

  test("a save that lands after switching conversations reloads for the one saved", () => {
    // The conversation on screen is already in the list, but the save is for
    // the one left behind -- whose first save still has to join the list.
    loaded([savedAnalysis(SAVED_ID)]);
    const { rerender } = renderHook(
      (p: ChatHistoryProps) => useChatHistory(p),
      {
        initialProps: props({ savedAnalysisId: SAVED_ID }),
      }
    );

    rerender(
      props({
        lastSave: { savedAnalysisId: NEW_ID },
        savedAnalysisId: SAVED_ID,
      })
    );

    expect(reload).toHaveBeenCalledTimes(1);
  });
});

// The open row is found by the saved analysis id, which never changes, rather
// than by the live session, which moves each time the analysis is reopened.
describe("buildHistoryItems selection", () => {
  const ANALYSES = [savedAnalysis(SAVED_ID), savedAnalysis(NEW_ID)];

  /**
   * The ids of the rows marked selected.
   * @param savedAnalysisId - Saved analysis on screen, or null
   * @returns Ids of the selected rows
   */
  function selectedIds(savedAnalysisId: string | null): string[] {
    return buildHistoryItems(ANALYSES, savedAnalysisId, jest.fn())
      .filter(({ selected }) => selected)
      .map(({ id }) => id);
  }

  test("selects the row of the saved analysis on screen", () => {
    expect(selectedIds(SAVED_ID)).toEqual([SAVED_ID]);
  });

  test("selects nothing while the conversation on screen isn't saved", () => {
    expect(selectedIds(null)).toEqual([]);
  });

  test("selects nothing when the saved analysis isn't in the list", () => {
    // E.g. a conversation saved to another account, restored by its cookie.
    expect(selectedIds("analysis-elsewhere")).toEqual([]);
  });

  test("opens another row, but not the one already showing", () => {
    const onOpen = jest.fn();
    const items = buildHistoryItems(ANALYSES, SAVED_ID, onOpen);

    items.find(({ id }) => id === SAVED_ID)?.onOpen();
    expect(onOpen).not.toHaveBeenCalled();

    items.find(({ id }) => id === NEW_ID)?.onOpen();
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: NEW_ID })
    );
  });
});
