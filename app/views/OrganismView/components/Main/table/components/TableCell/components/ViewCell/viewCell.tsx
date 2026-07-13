import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities.js";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { Button } from "@mui/material";
import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";
import { PangenomeMember } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/pangenome";

export const ViewCell = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: implement the view cell to link to the UCSC browser for the member assembly.
  row,
}: CellContext<PangenomeMember, unknown>): JSX.Element => {
  return (
    <Button
      color={BUTTON_PROPS.COLOR.SECONDARY}
      disabled
      href="/" // TODO: implement the view cell to link to the UCSC browser for the member assembly.
      rel={REL_ATTRIBUTE.NO_OPENER_NO_REFERRER}
      sx={{ textTransform: "none" }}
      target={ANCHOR_TARGET.BLANK}
      variant={BUTTON_PROPS.VARIANT.CONTAINED}
    >
      UCSC browser
    </Button>
  );
};
