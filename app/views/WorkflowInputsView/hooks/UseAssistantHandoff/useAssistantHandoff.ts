import { SOURCE_KEYS } from "../../state/constants";
import { useSourceState } from "../../state/hooks/UseSourceState/hook";
import { UseAssistantHandoff } from "./types";
import { getInitialConfiguredInput } from "./utils";

/**
 * Read the assistant→stepper handoff from app state. Returns the
 * synchronously-derivable initial configured input only; values that require
 * async resolution (e.g. ENA accessions → read-run data) are captured by
 * `useHandoffSync`.
 * @returns Initial configured input and handoff flag.
 */
export const useAssistantHandoff = (): UseAssistantHandoff => {
  const handoff = useSourceState(SOURCE_KEYS.ASSISTANT);
  return getInitialConfiguredInput(handoff);
};
