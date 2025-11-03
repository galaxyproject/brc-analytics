import { CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";
import { mapSelectCategoryValue } from "../../../../../../../../../../../../../../../../../../site-config/brc-analytics/local/index/common/category/mapSelectCategoryValue";
import { GROUP_ID_LABEL } from "../../components/TracksSelectionPanel/constants";

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  GROUP_ID: {
    key: "groupId",
    label: "Category",
    mapSelectCategoryValue: mapSelectCategoryValue(
      (label) => GROUP_ID_LABEL[label] || label
    ),
  },
  LONG_LABEL: { key: "longLabel", label: "Track Type" },
} as const;
