import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { Button } from "@mui/material";
import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";
import type { PangenomeMember } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/pangenome";

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
      color={BUTTON_PROPS.COLOR.SECONDARY}
      href={row.original.ucscBrowserUrl}
      rel={REL_ATTRIBUTE.NO_OPENER_NO_REFERRER}
      sx={{ textTransform: "none" }}
      target={ANCHOR_TARGET.BLANK}
      variant={BUTTON_PROPS.VARIANT.CONTAINED}
    >
      UCSC browser
    </Button>
  );
};
