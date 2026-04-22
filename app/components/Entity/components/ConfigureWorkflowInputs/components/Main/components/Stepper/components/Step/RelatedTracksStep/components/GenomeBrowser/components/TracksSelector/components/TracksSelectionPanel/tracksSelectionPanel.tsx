import { NoResults } from "@databiosphere/findable-ui/lib/components/NoResults/noResults";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ChevronRightRounded } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { flexRender } from "@tanstack/react-table";
import { Fragment, JSX } from "react";
import {
  StyledContainer,
  StyledRoundedPaper,
  StyledStack,
} from "./tracksSelectionPanel.styles";
import { Props } from "./types";
import { getGroupLabel, getIsLastRowInGroup } from "./utils";

export const TracksSelectionPanel = ({ table }: Props): JSX.Element => {
  const { getRowCount, getRowModel } = table;
  const { rows } = getRowModel();
  return (
    <StyledStack useFlexGap>
      {getRowCount() === 0 && (
        <NoResults Paper={StyledRoundedPaper} title="No tracks found" />
      )}
      {rows.map((row, i) => {
        return (
          <StyledContainer
            key={row.id}
            canExpand={row.getCanExpand()}
            canSelect={row.getCanSelect()}
            isGrouped={row.getIsGrouped()}
            isExpanded={row.getIsExpanded()}
            isLastRow={getIsLastRowInGroup(rows, row, i)}
            isSelected={row.getIsSelected()}
            isSubRow={row.depth >= 2}
            maxWidth={false}
            onClick={() => {
              if (row.getCanExpand()) {
                row.toggleExpanded();
                return;
              }
              if (row.getCanSelect()) {
                row.toggleSelected();
              }
            }}
          >
            {row.getIsGrouped() ? (
              <Fragment>
                <ChevronRightRounded
                  color={SVG_ICON_PROPS.COLOR.INK_LIGHT}
                  fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
                />
                <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
                  {getGroupLabel(row)}
                </Typography>
              </Fragment>
            ) : (
              row
                .getVisibleCells()
                .map((cell) => (
                  <Fragment key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Fragment>
                ))
            )}
          </StyledContainer>
        );
      })}
    </StyledStack>
  );
};
