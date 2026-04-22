import { ColumnFiltersAdapter } from "@databiosphere/findable-ui/lib/components/Filter/components/adapters/tanstack/ColumnFiltersAdapter/columnFiltersAdapter";
import { Controls } from "@databiosphere/findable-ui/lib/components/Filter/components/controls/Controls/controls";
import { Filters } from "@databiosphere/findable-ui/lib/components/Filter/components/Filters/filters";
import { SurfaceProps } from "@databiosphere/findable-ui/lib/components/Filter/components/surfaces/types";
import { RowData } from "@tanstack/react-table";
import { JSX } from "react";
import {
  StyledContainer,
  StyledSearchAllFilters,
} from "./columnFilters.styles";
import { Props } from "./types";
import { getCategoryViews } from "./utils";

export const ColumnFilters = <T extends RowData>({
  table,
}: Props<T>): JSX.Element => {
  return (
    <StyledContainer>
      <ColumnFiltersAdapter
        renderSurface={(props: SurfaceProps) => (
          <>
            <Controls
              filterSort={props.filterSort}
              filterSortEnabled={props.filterSortEnabled}
              onFilter={props.onFilter}
              onFilterSortChange={props.onFilterSortChange}
            />
            <StyledSearchAllFilters
              categoryViews={getCategoryViews(props.categoryFilters)}
              onFilter={props.onFilter}
            />
            <Filters {...props} />
          </>
        )}
        table={table}
      />
    </StyledContainer>
  );
};
