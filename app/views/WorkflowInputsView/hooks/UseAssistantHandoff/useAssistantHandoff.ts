import { useRouter } from "next/router";
import { UseAssistantHandoff } from "./types";
import { getInitialConfiguredInputFromQuery } from "./utils";

/**
 * Read the assistant→stepper handoff signal from the URL. Returns the
 * synchronously-derivable initial configured input only; values that require
 * async resolution (e.g. ENA accessions → read-run data) are captured by
 * `useHandoffSync`.
 * @returns Initial configured input and handoff flag.
 */
export const useAssistantHandoff = (): UseAssistantHandoff => {
  const { query } = useRouter();
  return getInitialConfiguredInputFromQuery(query);
};
