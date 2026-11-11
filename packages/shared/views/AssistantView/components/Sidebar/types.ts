import type {
  LastSave,
  UseAssistantChatActions,
} from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
import { type ReactNode } from "react";

export interface SidebarProps {
  disabled: boolean;
  disclaimer: ReactNode;
  lastSave: LastSave | null;
  onNewAnalysis: () => void;
  onOpenConversation: UseAssistantChatActions["onOpenConversation"];
  savedAnalysisId: string | null;
  sessionId: string | null;
  supportUrl?: string;
}
