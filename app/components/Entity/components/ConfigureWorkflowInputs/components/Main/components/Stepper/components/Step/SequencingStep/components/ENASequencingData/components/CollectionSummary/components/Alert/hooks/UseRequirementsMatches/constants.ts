import { CATEGORY_CONFIGS } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/hooks/UseTable/categoryConfigs";
import { ReadRun } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";

export const COLUMN_KEY_TO_LABEL: Partial<Record<keyof ReadRun, string>> = {
  [CATEGORY_CONFIGS.DESCRIPTION.key]: "Description",
  [CATEGORY_CONFIGS.LIBRARY_LAYOUT.key]: "Library layout",
  [CATEGORY_CONFIGS.LIBRARY_SOURCE.key]: "Library source",
  [CATEGORY_CONFIGS.LIBRARY_STRATEGY.key]: "Library strategy",
  [CATEGORY_CONFIGS.TAX_ID.key]: "Species",
};
