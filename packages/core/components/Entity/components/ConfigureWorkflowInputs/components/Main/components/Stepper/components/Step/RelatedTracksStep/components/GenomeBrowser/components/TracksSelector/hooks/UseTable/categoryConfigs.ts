import { GROUP_ID_LABEL } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/GenomeBrowser/components/TracksSelector/components/TracksSelectionPanel/constants";
import { CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";
import { mapSelectCategoryValue } from "@site-config/brc-analytics/local/index/common/category/mapSelectCategoryValue";

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  GROUP_ID: {
    key: "groupId",
    label: "Category",
    mapSelectCategoryValue: mapSelectCategoryValue(
      (label) => GROUP_ID_LABEL[label] || label
    ),
  },
  SHORT_LABEL: { key: "shortLabel", label: "Track Type" },
} as const;
