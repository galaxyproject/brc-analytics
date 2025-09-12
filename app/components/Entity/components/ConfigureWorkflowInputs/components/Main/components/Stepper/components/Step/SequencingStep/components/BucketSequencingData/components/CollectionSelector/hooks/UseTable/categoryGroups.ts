import { CategoryGroup } from "@databiosphere/findable-ui/lib/config/entities";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    categoryConfigs: [CATEGORY_CONFIGS.SCIENTIFIC_NAME],
    label: "Organism",
  },
  {
    categoryConfigs: [
      CATEGORY_CONFIGS.SAMPLE_ACCESSION,
      CATEGORY_CONFIGS.STUDY_ACCESSION,
      CATEGORY_CONFIGS.RUN_ACCESSION,
      CATEGORY_CONFIGS.EXPERIMENT_ACCESSION,
    ],
    label: "Accession",
  },
  {
    categoryConfigs: [
      CATEGORY_CONFIGS.INSTRUMENT_PLATFORM,
      CATEGORY_CONFIGS.INSTRUMENT_MODEL,
    ],
    label: "Instrument",
  },
  {
    categoryConfigs: [
      CATEGORY_CONFIGS.LIBRARY_STRATEGY,
      CATEGORY_CONFIGS.LIBRARY_LAYOUT,
    ],
    label: "Library",
  },
  {
    categoryConfigs: [CATEGORY_CONFIGS.READ_COUNT, CATEGORY_CONFIGS.BASE_COUNT],
    label: "Count",
  },
];
