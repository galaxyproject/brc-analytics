import { useMemo } from "react";
import { Workflow } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { UseConfiguredSteps } from "./types";
import { buildSteps } from "./utils";

export const useConfiguredSteps = (workflow: Workflow): UseConfiguredSteps => {
  const configuredSteps = useMemo(() => buildSteps(workflow), [workflow]);

  return { configuredSteps };
};
