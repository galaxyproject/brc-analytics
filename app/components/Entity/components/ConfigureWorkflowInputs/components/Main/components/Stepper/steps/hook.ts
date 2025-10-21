import { Workflow } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { useMemo } from "react";
import { buildSteps } from "./utils";
import { UseConfiguredSteps } from "./types";

export const useConfiguredSteps = (workflow: Workflow): UseConfiguredSteps => {
  const configuredSteps = useMemo(() => buildSteps(workflow), [workflow]);

  return { configuredSteps };
};
