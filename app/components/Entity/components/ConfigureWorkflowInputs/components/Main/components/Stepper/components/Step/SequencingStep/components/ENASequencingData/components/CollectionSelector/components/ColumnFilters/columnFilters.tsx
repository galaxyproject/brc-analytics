import { Props } from "./types";
import { ColumnFiltersAdapter } from "@databiosphere/findable-ui/lib/components/Filter/components/adapters/tanstack/ColumnFiltersAdapter/columnFiltersAdapter";
import { SurfaceProps } from "@databiosphere/findable-ui/lib/components/Filter/components/surfaces/types";
import { Filters } from "@databiosphere/findable-ui/lib/components/Filter/components/Filters/filters";
import { StyledContainer } from "./columnFilters.styles";
import { Controls } from "@databiosphere/findable-ui/lib/components/Filter/components/controls/Controls/controls";
import { StyledSearchAllFilters } from "./columnFilters.styles";
import { getCategoryViews } from "./utils";

export const ColumnFilters = ({ table }: Props): JSX.Element => {
  return (
    <StyledContainer>
      <ColumnFiltersAdapter
        renderSurface={(props: SurfaceProps) => (
          <>
            <Controls onFilter={props.onFilter} />
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
