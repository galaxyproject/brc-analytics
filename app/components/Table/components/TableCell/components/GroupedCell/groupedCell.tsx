import { CellContext } from "@tanstack/react-table";
import { IconButton } from "@mui/material";
import { UnfoldMoreIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/UnfoldMoreIcon/unfoldMoreIcon";

export const GroupedCell = (
  ctx: CellContext<unknown, unknown>
): JSX.Element => {
  return (
    <IconButton
      color="ink"
      edge="end"
      onClick={() => ctx.row.toggleExpanded()}
      size="large"
    >
      <UnfoldMoreIcon fontSize="small" />
    </IconButton>
  );
};
