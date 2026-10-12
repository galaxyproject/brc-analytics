export interface UseConversationKey {
  conversationKey: number;
  onNewAnalysis: () => void;
  onOpeningChange: (isOpening: boolean) => void;
}
