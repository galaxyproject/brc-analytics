export const ASSISTANT_HANDOFF_KEY = "brc-assistant-handoff";

export interface AssistantHandoff {
  dataSource: "ena" | "upload";
  timestamp: number;
}
