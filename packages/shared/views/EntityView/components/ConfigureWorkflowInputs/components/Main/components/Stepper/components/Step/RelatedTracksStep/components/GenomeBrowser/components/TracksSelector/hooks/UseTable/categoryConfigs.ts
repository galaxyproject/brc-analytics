import { type CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";
import { mapSelectCategoryValue } from "@repo/shared/utils/mapSelectCategoryValue";
import { GROUP_ID_LABEL } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/GenomeBrowser/components/TracksSelector/components/TracksSelectionPanel/constants";

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
