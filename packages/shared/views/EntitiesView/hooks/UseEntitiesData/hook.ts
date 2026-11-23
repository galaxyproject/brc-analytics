import { getEntitiesData } from "@repo/shared/views/EntitiesView/utils";
import { useMemo } from "react";

/**
 * Returns the explore view's entities for an entity list type. The array keeps
 * its identity until the entity list type changes, so the explore view does not
 * re-process the entities each time the page re-renders.
 * @param entityListType - Entity list type.
 * @returns entities consumed by the explore view.
 */
export function useEntitiesData<T>(entityListType: string): T[] {
  return useMemo(() => getEntitiesData<T>(entityListType), [entityListType]);
}
