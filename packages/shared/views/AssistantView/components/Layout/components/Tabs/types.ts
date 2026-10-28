import type { UseLayoutTab } from "@repo/shared/views/AssistantView/components/Layout/hooks/UseLayoutTab/types";
import type { LayoutTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import type { ReactNode } from "react";

/**
 * A column's tab.
 */
export interface Tab {
  label: ReactNode;
  value: LayoutTab;
}

export interface TabsProps {
  baseId: string;
  onTabChange: UseLayoutTab["onTabChange"];
  tabs: Tab[];
  value: LayoutTab;
}
