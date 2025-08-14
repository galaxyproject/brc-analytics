import { Grid } from "@mui/material";
import { Props } from "./types";
import { ColumnFilter } from "@databiosphere/findable-ui/lib/components/Table/components/TableFeatures/ColumnFilter/columnFilter";
import { MENU_PROPS } from "./constants";

export const Filters = ({ table }: Props): JSX.Element | null => {
  const columns = table.getAllColumns();
  const columnFilters = columns.filter((column) => column.getCanFilter());
  const enableColumnFilters = table.options.enableColumnFilters;
  console.log(columnFilters);

  if (!enableColumnFilters) return null;

  return (
    <Grid container flexDirection="column">
      {columnFilters.map((column) => (
        <ColumnFilter key={column.id} {...MENU_PROPS} column={column} />
      ))}
    </Grid>
  );
};

// <Filters
//   categoryFilters={categoryFilters}
//   onFilter={onFilterChange.bind(null, false)}
//   surfaceType={mdDown ? SURFACE_TYPE.DRAWER : SURFACE_TYPE.MENU}
//   trackFilterOpened={trackingConfig?.trackFilterOpened}
// />;
