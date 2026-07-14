import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Alert, Stack } from "@mui/material";
import { RowData } from "@tanstack/react-table";
import { JSX } from "react";
import { Table } from "../../../../../../components/common/Table/table";
import { StyledSectionTitle } from "../../main.styles";
import { Toolbar } from "../../table/components/Toolbar/toolbar";
import { useTable } from "../../table/hooks/UseTable/hook";
import { StyledFluidPaper } from "../../table/table.styles";
import { EmptyState } from "../EmptyState/emptyState";
import { Props } from "./types";

/**
 * Assemblies section for the organism page: header, an info alert, and the
 * assemblies table (or an empty state when the organism has no assemblies).
 * @param props - Component props.
 * @param props.columnPresets - Column presets for the assemblies table.
 * @param props.tableOptions - Options for the assemblies table.
 * @returns The Assemblies section.
 */
export const AssembliesSection = <T extends RowData>({
  columnPresets,
  tableOptions,
}: Props<T>): JSX.Element => {
  const table = useTable<T>(tableOptions);
  return (
    <Stack spacing={4} useFlexGap>
      <StyledSectionTitle
        component="h2"
        id="assemblies"
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
      >
        Assemblies
      </StyledSectionTitle>
      <Alert component={FluidPaper} {...ALERT_PROPS.STANDARD_INFO}>
        Perform an analysis in the context of an assembly.
      </Alert>
      {table.getRowCount() === 0 ? (
        <EmptyState>
          No assemblies are associated with this organism in the catalog.
        </EmptyState>
      ) : (
        <StyledFluidPaper elevation={0}>
          <Toolbar columnPresets={columnPresets} table={table} />
          <Table table={table} />
        </StyledFluidPaper>
      )}
    </Stack>
  );
};
