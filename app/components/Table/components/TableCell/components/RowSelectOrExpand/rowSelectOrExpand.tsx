import { CellContext, RowData } from "@tanstack/react-table";
import { RowSelectionCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/RowSelectionCell/rowSelectionCell";
import { ChevronRightRounded } from "@mui/icons-material";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";

export const RowSelectOrExpand = <T extends RowData, TValue = unknown>(
  ctx: CellContext<T, TValue>
): JSX.Element => {
  const { row } = ctx;
  const { getCanExpand } = row;

  if (getCanExpand())
    return (
      <ChevronRightRounded
        color={SVG_ICON_PROPS.COLOR.INK_LIGHT}
        fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
      />
    );

  return <RowSelectionCell {...ctx} />;
};
