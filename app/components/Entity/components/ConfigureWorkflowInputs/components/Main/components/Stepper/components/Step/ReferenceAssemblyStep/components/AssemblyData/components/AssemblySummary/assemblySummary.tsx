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
import { Fragment, JSX } from "react";
import { StyledRoundedPaper, StyledStack } from "./assemblySummary.styles";
import { Props } from "./types";

/**
 * Assembly summary component displaying the selected assembly details.
 * @param props - Component props.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.onEdit - Callback to open the assembly selector dialog.
 * @param props.table - Assembly table instance.
 * @returns Assembly summary component with selected assembly details and edit action.
 */
export const AssemblySummary = ({
  configuredInput,
  onEdit,
  table,
}: Props): JSX.Element | null => {
  if (!configuredInput.referenceAssembly) return null;
  const { getSelectedRowModel } = table;
  return (
    <Fragment>
      <StyledRoundedPaper elevation={0}>
        <StyledStack>
          <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
            1 Assembly Selected
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
                <TableCell variant="head">Species</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getSelectedRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.original.accession}</TableCell>
                  <TableCell>{row.original.taxonomicLevelSpecies}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </GridTable>
        </TableContainer>
      </StyledRoundedPaper>
    </Fragment>
  );
};
