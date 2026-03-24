import { useState } from "react";
import { AssistantHandoff } from "./types";

const ASSISTANT_HANDOFF_KEY = "brc-assistant-handoff";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

function readAndConsumeHandoff(): AssistantHandoff | null {
  try {
    const raw = localStorage.getItem(ASSISTANT_HANDOFF_KEY);
    if (!raw) return null;
    localStorage.removeItem(ASSISTANT_HANDOFF_KEY);
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.dataSource !== "string" ||
      typeof parsed?.timestamp !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) return null;
    return parsed as AssistantHandoff;
  } catch {
    return null;
  }
}

export const useAssistantHandoff = (): { handoff: AssistantHandoff | null } => {
  const [handoff] = useState<AssistantHandoff | null>(readAndConsumeHandoff);
  return { handoff };
};
