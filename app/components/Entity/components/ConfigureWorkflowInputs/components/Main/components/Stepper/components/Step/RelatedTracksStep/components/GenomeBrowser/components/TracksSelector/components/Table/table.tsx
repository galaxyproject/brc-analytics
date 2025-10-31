import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { ROW_DIRECTION } from "@databiosphere/findable-ui/lib/components/Table/common/entities";
import { TableBody } from "@databiosphere/findable-ui/lib/components/Detail/components/Table/components/TableBody/tableBody";
import { StyledAccordion } from "./table.styles";
import {
  AccordionDetails,
  AccordionSummary,
  TableContainer,
  Typography,
} from "@mui/material";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";
import { Props } from "./types";
import { ChevronRightRounded } from "@mui/icons-material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ACCORDION_PROPS, GROUP_ID_LABEL } from "./constants";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";

export const Table = ({ defaultExpanded, row, table }: Props): JSX.Element => {
  const groupId = row.getValue("groupId") as string;
  console.log(row.id, row.subRows);
  return (
    <StyledAccordion {...ACCORDION_PROPS} defaultExpanded={defaultExpanded}>
      <AccordionSummary
        expandIcon={
          <ChevronRightRounded fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL} />
        }
      >
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
          {GROUP_ID_LABEL[groupId] || groupId} (2)
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer>
          <GridTable
            gridTemplateColumns={getColumnTrackSizing(
              table.getVisibleFlatColumns()
            )}
          >
            <TableBody
              rowDirection={ROW_DIRECTION.DEFAULT}
              rows={row.subRows}
              tableInstance={table}
            />
          </GridTable>
        </TableContainer>
      </AccordionDetails>
    </StyledAccordion>
  );
};
