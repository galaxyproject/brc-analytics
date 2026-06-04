import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Alert } from "@mui/material";
import { RowData } from "@tanstack/react-table";
import { JSX } from "react";
import WORKFLOW_CATEGORIES from "../../../../../catalog/output/workflows.json";
import { ROUTES } from "../../../../../routes/constants";
import { Table } from "../../../../components/common/Table/table";
import { Accordion } from "../../../AnalyzeWorkflowsView/components/Main/components/Accordion/accordion";
import { EmptyState } from "./components/EmptyState/emptyState";
import { StyledSectionTitle } from "./main.styles";
import { useTable } from "./table/hooks/UseTable/hook";
import { StyledFluidPaper } from "./table/table.styles";
import type { Props } from "./types";
import { buildOrganismWorkflows } from "./utils";

/**
 * Main column for the organism detail page: organism-scoped workflows section
 * and the assemblies section (header, info alert, and assemblies table).
 * @param props - Component props.
 * @param props.entityId - Organism entity ID.
 * @param props.organism - Organism.
 * @param props.tableOptions - Options for the assemblies table.
 * @returns A JSX element with the organism detail main content.
 */
export const Main = <T extends RowData>({
  entityId,
  organism,
  tableOptions,
}: Props<T>): JSX.Element => {
  const table = useTable<T>(tableOptions);
  const isAssemblyWorkflowsEnabled = useFeatureFlag("assembly-workflows");
  const workflowCategories = buildOrganismWorkflows(
    organism,
    WORKFLOW_CATEGORIES,
    isAssemblyWorkflowsEnabled
  );
  return (
    <>
      <StyledSectionTitle
        component="h2"
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
      >
        Organism specific workflows
      </StyledSectionTitle>
      {workflowCategories.length === 0 ? (
        <EmptyState>
          No organism-specific workflows exist for this organism.
        </EmptyState>
      ) : (
        workflowCategories.map((workflowCategory) => (
          <Accordion
            configureRoute={ROUTES.CONFIGURE_ORGANISM_WORKFLOW}
            disabled={workflowCategory.workflows.length === 0}
            entityId={entityId}
            key={workflowCategory.category}
            workflowCategory={workflowCategory}
            workflows={workflowCategory.workflows}
          />
        ))
      )}
      <StyledSectionTitle
        component="h2"
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
          <Table table={table} />
        </StyledFluidPaper>
      )}
    </>
  );
};
