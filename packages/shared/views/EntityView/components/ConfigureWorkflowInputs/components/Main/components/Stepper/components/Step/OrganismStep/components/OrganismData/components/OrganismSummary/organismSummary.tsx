import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  Button,
  Divider,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ScientificName } from "@repo/shared/components/ScientificName/scientificName";
import {
  StyledRoundedPaper,
  StyledStack,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/SelectorSummary/selectorSummary.styles";
import { type JSX } from "react";
import { type Props } from "./types";

/**
 * Organism summary component displaying the selected organism details.
 * @param props - Component props.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.onEdit - Callback to open the organism selector dialog.
 * @param props.table - Organism table instance.
 * @returns Organism summary component with selected organism details and edit action.
 */
export const OrganismSummary = ({
  configuredInput,
  onEdit,
  table,
}: Props): JSX.Element | null => {
  if (!configuredInput.organism) return null;
  const { getSelectedRowModel } = table;
  return (
    <StyledRoundedPaper elevation={0}>
      <StyledStack>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          1 Organism Selected
        </Typography>
        <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onEdit}>
          Edit
        </Button>
      </StyledStack>
      <Divider />
      <TableContainer>
        <GridTable gridTemplateColumns="1fr auto">
          <TableHead>
            <TableRow>
              <TableCell variant="head">Species</TableCell>
              <TableCell variant="head">Taxonomy ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getSelectedRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <ScientificName>
                    {row.original.taxonomicLevelSpecies}
                  </ScientificName>
                </TableCell>
                <TableCell>{row.original.ncbiTaxonomyId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </GridTable>
      </TableContainer>
    </StyledRoundedPaper>
  );
};
