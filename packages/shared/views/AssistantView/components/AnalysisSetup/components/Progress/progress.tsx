import { countSetFields } from "@repo/shared/views/AssistantView/components/AnalysisSetup/utils";
import { type JSX } from "react";
import { StyledLinearProgress } from "./progress.styles";
import type { ProgressProps } from "./types";
import { getProgressValue } from "./utils";

/**
 * Renders progress through the analysis setup as the share of fields set.
 * @param props - Component props.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @returns The progress bar element.
 */
export const Progress = ({ schema }: ProgressProps): JSX.Element => {
  return (
    <StyledLinearProgress
      aria-label="Analysis setup progress"
      value={getProgressValue(countSetFields(schema))}
      variant="determinate"
    />
  );
};
