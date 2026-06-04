export const ASSISTANT_HANDOFF_KEY = "brc-assistant-handoff";

export type HandoffDataSource = "ena" | "upload";

export interface AssistantHandoff {
  dataSource: HandoffDataSource;
  timestamp: number;
}
