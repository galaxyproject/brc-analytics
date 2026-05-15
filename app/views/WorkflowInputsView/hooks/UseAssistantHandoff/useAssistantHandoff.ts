import { useState } from "react";
import { ASSISTANT_HANDOFF_KEY, AssistantHandoff } from "./types";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

// Module-scoped cache of the consumed handoff. React strict-mode runs every
// component mount twice in dev (mount, unmount, remount), and the second
// mount's useState initializer would otherwise read a freshly-cleared
// localStorage and resolve to null -- losing the handoff between mounts and
// breaking the dataSource pre-selection downstream.
let cachedHandoff: AssistantHandoff | null | undefined;

function readAndConsumeHandoff(): AssistantHandoff | null {
  try {
    const raw = localStorage.getItem(ASSISTANT_HANDOFF_KEY);
    if (raw) {
      // A fresh handoff is in localStorage: consume it and update the cache.
      localStorage.removeItem(ASSISTANT_HANDOFF_KEY);
      const parsed = JSON.parse(raw);
      if (
        typeof parsed?.dataSource !== "string" ||
        typeof parsed?.timestamp !== "number" ||
        Date.now() - parsed.timestamp > MAX_AGE_MS
      ) {
        cachedHandoff = null;
        return null;
      }
      cachedHandoff = parsed as AssistantHandoff;
      return cachedHandoff;
    }
    // No fresh handoff: fall back to whatever the previous read produced so
    // the strict-mode remount sees the same value as the first mount.
    return cachedHandoff ?? null;
  } catch {
    cachedHandoff = null;
    return null;
  }
}

export const useAssistantHandoff = (): { handoff: AssistantHandoff | null } => {
  const [handoff] = useState<AssistantHandoff | null>(readAndConsumeHandoff);
  return { handoff };
};
