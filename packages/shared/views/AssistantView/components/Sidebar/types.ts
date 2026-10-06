import { type ReactNode } from "react";

export interface SidebarProps {
  disclaimer: ReactNode;
  isSaved: boolean;
  onNewAnalysis: () => void;
  sessionId: string | null;
  supportUrl?: string;
}
