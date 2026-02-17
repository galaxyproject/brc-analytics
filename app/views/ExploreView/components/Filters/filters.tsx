import { ColumnFiltersAdapter } from "@databiosphere/findable-ui/lib/components/Filter/components/adapters/tanstack/ColumnFiltersAdapter/columnFiltersAdapter";
import { Controls } from "@databiosphere/findable-ui/lib/components/Filter/components/controls/Controls/controls";
import { Filters as DXFilters } from "@databiosphere/findable-ui/lib/components/Filter/components/Filters/filters";
import {
  SURFACE_TYPE,
  type SurfaceProps,
} from "@databiosphere/findable-ui/lib/components/Filter/components/surfaces/types";
import { Sidebar } from "@databiosphere/findable-ui/lib/components/Layout/components/Sidebar/sidebar";
import { useBreakpoint } from "@databiosphere/findable-ui/lib/hooks/useBreakpoint";
import { RowData } from "@tanstack/react-table";
import React, { JSX } from "react";
import { StyledSearchAllFilters } from "./filters.styles";
import { StyledBox } from "./filters.styles";
import type { Props } from "./types";
import { getCategoryViews } from "../../utils";

/**
 * Renders the Filters component, which provides UI controls for filtering table data.
 * @param props - Props.
 * @param props.table - Table instance.
 * @returns Filters component.
 */
export const Filters = <T extends RowData>({
  table,
}: Props<T>): JSX.Element => {
  const { mdDown } = useBreakpoint();
  return (
    <Sidebar>
      <ColumnFiltersAdapter
        renderSurface={(props: SurfaceProps) => (
          <>
            <StyledBox>
              <Controls
                filterSort={props.filterSort}
                filterSortEnabled={props.filterSortEnabled}
                onFilter={props.onFilter}
                onFilterSortChange={props.onFilterSortChange}
              />
              <StyledSearchAllFilters
                categoryViews={getCategoryViews(props.categoryFilters)}
                onFilter={props.onFilter}
                surfaceType={
                  mdDown ? SURFACE_TYPE.POPPER_DRAWER : SURFACE_TYPE.POPPER_MENU
                }
              />
            </StyledBox>
            <DXFilters
              {...props}
              surfaceType={mdDown ? SURFACE_TYPE.DRAWER : SURFACE_TYPE.MENU}
            />
          </>
        )}
        table={table}
      />
    </Sidebar>
  );
};
