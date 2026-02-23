import { DrawerProvider } from "@databiosphere/findable-ui/lib/components/common/Drawer/provider/provider";
import React, { JSX } from "react";
import { Filters } from "./components/Filters/filters";
import { useTable } from "./hooks/UseTable/hook";
import type { Props } from "./types";

/**
 * ExploreView renders the main exploration interface,
 * including filters and accompanying components, for a given data type.
 * @param props - Props.
 * @param props.Component - Component to render within the explore view.
 * @returns Explore view.
 */
export const ExploreView = <T,>({
  Component,
  ...props
}: Props<T>): JSX.Element => {
  const { table } = useTable(props);
  return (
    <DrawerProvider>
      <Filters table={table} />
      <Component table={table} />
    </DrawerProvider>
  );
};
