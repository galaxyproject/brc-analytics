import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
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
import { getGenomeStrainText } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import {
  StyledRoundedPaper,
  StyledStack,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/SelectorSummary/selectorSummary.styles";
import { type JSX } from "react";
import { type Props } from "./types";
import { getConfiguredAssemblies, renderSelectedCount } from "./utils";

/**
 * Assemblies summary component displaying the selected assemblies.
 * @param props - Component props.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.onEdit - Callback to open the assemblies selector dialog.
 * @param props.table - Assemblies table instance.
 * @returns Assemblies summary component with the selected assemblies and edit action.
 */
export const AssembliesSummary = ({
  configuredInput,
  onEdit,
  table,
}: Props): JSX.Element | null => {
  const assemblies = getConfiguredAssemblies(
    table,
    configuredInput.fastaCollection
  );
  if (assemblies.length === 0) return null;
  return (
    <StyledRoundedPaper elevation={0}>
      <StyledStack>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          {renderSelectedCount(assemblies.length)}
        </Typography>
        <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onEdit}>
          Edit
        </Button>
      </StyledStack>
      <Divider />
      <TableContainer>
        <GridTable gridTemplateColumns="auto 1fr">
          <TableHead>
            <TableRow>
              <TableCell variant="head">Accession</TableCell>
              <TableCell variant="head">Strain</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assemblies.map((assembly) => (
              <TableRow key={assembly.accession}>
                <TableCell>{assembly.accession}</TableCell>
                <TableCell>
                  {getGenomeStrainText(assembly, LABEL.UNSPECIFIED)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </GridTable>
      </TableContainer>
    </StyledRoundedPaper>
  );
};
