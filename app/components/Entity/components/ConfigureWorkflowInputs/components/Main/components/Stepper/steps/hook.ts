import type { Workflow } from "@brc-analytics/core/apis/workflow";
import { useMemo } from "react";
import { UseConfiguredSteps } from "./types";
import { buildSteps } from "./utils";

export const useConfiguredSteps = (workflow: Workflow): UseConfiguredSteps => {
  const configuredSteps = useMemo(() => buildSteps(workflow), [workflow]);

  return { configuredSteps };
};
