import type { PangenomeMember } from "@brc/apis/pangenome";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { BUTTON_PRESETS } from "@databiosphere/findable-ui/lib/contracts/mui/Button/presets";
import { Button } from "@mui/material";
import { type CellContext } from "@tanstack/react-table";
import { type JSX } from "react";

/**
 * View cell for the pangenome members table: a button linking to the member
 * assembly's UCSC browser (with the pangenome track hub).
 * @param props - Component props.
 * @param props.row - Row context.
 * @returns The UCSC browser link button.
 */
export const ViewCell = ({
  row,
}: CellContext<PangenomeMember, unknown>): JSX.Element => {
  return (
    <Button
      {...BUTTON_PRESETS.SECONDARY_OUTLINED}
      href={row.original.ucscBrowserUrl}
      rel={REL_ATTRIBUTE.NO_OPENER_NO_REFERRER}
      sx={{ textTransform: "none" }}
      target={ANCHOR_TARGET.BLANK}
    >
      UCSC browser
    </Button>
  );
};
