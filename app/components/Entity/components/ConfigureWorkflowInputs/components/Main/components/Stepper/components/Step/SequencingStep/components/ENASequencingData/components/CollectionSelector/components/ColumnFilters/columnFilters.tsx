import { Props } from "./types";
import { ColumnFiltersAdapter } from "@databiosphere/findable-ui/lib/components/Filter/components/adapters/tanstack/ColumnFiltersAdapter/columnFiltersAdapter";
import { SurfaceProps } from "@databiosphere/findable-ui/lib/components/Filter/components/surfaces/types";
import { Filters } from "@databiosphere/findable-ui/lib/components/Filter/components/Filters/filters";
import { StyledGrid } from "./columnFilters.styles";

export const ColumnFilters = ({ table }: Props): JSX.Element => {
  return (
    <StyledGrid container>
      <ColumnFiltersAdapter
        renderSurface={(props: SurfaceProps) => <Filters {...props} />}
        table={table}
      />
    </StyledGrid>
  );
};
