import type { LastSave } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
import { type ReactNode } from "react";

export interface SidebarProps {
  disabled: boolean;
  disclaimer: ReactNode;
  lastSave: LastSave | null;
  onNewAnalysis: () => void;
  onOpeningChange: (isOpening: boolean) => void;
  sessionId: string | null;
  supportUrl?: string;
}
