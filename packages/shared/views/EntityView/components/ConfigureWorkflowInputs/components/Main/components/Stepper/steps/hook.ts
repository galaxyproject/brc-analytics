import type { Workflow } from "@repo/shared/apis/workflow";
import { useMemo } from "react";
import { type UseConfiguredSteps } from "./types";
import { buildSteps } from "./utils";

export const useConfiguredSteps = (workflow: Workflow): UseConfiguredSteps => {
  const configuredSteps = useMemo(() => buildSteps(workflow), [workflow]);

  return { configuredSteps };
};
