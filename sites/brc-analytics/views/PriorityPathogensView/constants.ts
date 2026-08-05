import { type OUTBREAK_PRIORITY } from "@brc/apis/schema-types";

export const PRIORITY: Record<OUTBREAK_PRIORITY, number> = {
  CRITICAL: 2,
  HIGH: 3,
  HIGHEST: 1,
  MODERATE: 5,
  MODERATE_HIGH: 4,
};
