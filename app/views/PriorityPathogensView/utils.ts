import { COLLATOR_CASE_INSENSITIVE } from "@databiosphere/findable-ui/lib/common/constants";
import { Outbreak } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { PRIORITY } from "./constants";

/**
 * Sorts priority pathogens by priority, then name.
 * @param pp01 - First priority pathogen.
 * @param pp02 - Second priority pathogen.
 * @returns -1 if pp01 < pp02, 0 if pp01 === pp02, 1 if pp01 > pp02.
 */
export function sortPriorityPathogen(pp01: Outbreak, pp02: Outbreak): number {
  return (
    PRIORITY[pp01.priority] - PRIORITY[pp02.priority] ||
    COLLATOR_CASE_INSENSITIVE.compare(pp01.name, pp02.name)
  );
}
