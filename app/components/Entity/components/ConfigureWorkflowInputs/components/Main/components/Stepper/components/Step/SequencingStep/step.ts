import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { StepConfig } from "../types";
import { SequencingStep } from "./sequencingStep";

export const ANY_END_STEP = {
  Step: SequencingStep,
  disabled: false,
  key: "readRunsAny",
  label: "Sequencing Data",
} satisfies StepConfig;

export const PAIRED_END_STEP = {
  Step: SequencingStep,
  disabled: false,
  key: "readRunsPaired",
  label: "Paired-End Sequencing Data",
  renderValue({ readRunsPaired }): string | undefined {
    if (readRunsPaired === null) return LABEL.NONE;
    if (readRunsPaired === undefined) return undefined;
    if (readRunsPaired.length === 0) return "User upload to Galaxy";
    return readRunsPaired.map(({ runAccession }) => runAccession).join(", ");
  },
} satisfies StepConfig;

export const SINGLE_END_STEP = {
  Step: SequencingStep,
  disabled: false,
  key: "readRunsSingle",
  label: "Single-End Sequencing Data",
  renderValue({ readRunsSingle }): string | undefined {
    if (readRunsSingle === null) return LABEL.NONE;
    if (readRunsSingle === undefined) return undefined;
    if (readRunsSingle.length === 0) return "User upload to Galaxy";
    return readRunsSingle.map(({ runAccession }) => runAccession).join(", ");
  },
} satisfies StepConfig;
