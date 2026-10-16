import { SelectTabContext } from "@repo/shared/views/AssistantView/components/Layout/context";
import type { SelectTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import { useContext } from "react";

/**
 * Returns the layout's handler for switching the column shown while the
 * columns are tabbed, for content inside a column.
 * @returns Handler that switches to a column.
 */
export const useSelectTab = (): SelectTab => {
  return useContext(SelectTabContext);
};
