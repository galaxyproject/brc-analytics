import type {
  UseAssistantChatActions,
  UseAssistantChatState,
} from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";

/**
 * Chat actions for a component under test, each a spy.
 * @param overrides - Actions to replace.
 * @returns The actions.
 */
export function chatActions(
  overrides: Partial<UseAssistantChatActions> = {}
): UseAssistantChatActions {
  return {
    onClearField: jest.fn().mockResolvedValue(undefined),
    onOpenConversation: jest.fn().mockResolvedValue(true),
    onResetSession: jest.fn(),
    onSendMessage: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Chat state for a component under test: an empty conversation, idle.
 * @param overrides - State to replace.
 * @returns The state.
 */
export function chatState(
  overrides: Partial<UseAssistantChatState> = {}
): UseAssistantChatState {
  return {
    error: null,
    handoffUrl: null,
    isRestoring: false,
    isSaved: false,
    lastSave: null,
    loading: false,
    logan: null,
    messages: [],
    savedAnalysisId: null,
    schema: null,
    shownSessionId: null,
    suggestions: [],
    ...overrides,
  };
}
