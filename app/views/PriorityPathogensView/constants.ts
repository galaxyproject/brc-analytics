import { OUTBREAK_PRIORITY } from "app/apis/catalog/brc-analytics-catalog/common/schema-entities";

export const PRIORITY: Record<OUTBREAK_PRIORITY, number> = {
  CRITICAL: 1,
  HIGH: 3,
  HIGHEST: 2,
  MODERATE: 5,
  MODERATE_HIGH: 4,
};
