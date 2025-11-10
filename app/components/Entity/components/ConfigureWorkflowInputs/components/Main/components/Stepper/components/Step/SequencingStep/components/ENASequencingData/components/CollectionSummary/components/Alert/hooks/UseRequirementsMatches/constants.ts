import { ReadRun } from "../../../../../../types";
import { CATEGORY_CONFIGS } from "../../../../../CollectionSelector/hooks/UseTable/categoryConfigs";

export const COLUMN_KEY_TO_LABEL: Partial<Record<keyof ReadRun, string>> = {
  [CATEGORY_CONFIGS.DESCRIPTION.key]: "Description",
  [CATEGORY_CONFIGS.LIBRARY_LAYOUT.key]: "Library layout",
  [CATEGORY_CONFIGS.LIBRARY_SOURCE.key]: "Library source",
  [CATEGORY_CONFIGS.LIBRARY_STRATEGY.key]: "Library strategy",
};
