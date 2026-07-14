import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { Chip } from "@mui/material";
import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";
import type { PangenomeMember } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/pangenome";

/**
 * Selection tracks cell for the pangenome members table: a chip indicating
 * whether the member has selection tracks.
 * @param props - Component props.
 * @param props.row - Row context.
 * @returns The selection tracks cell.
 */
export const SelectionTracksCell = ({
  row,
}: CellContext<PangenomeMember, unknown>): JSX.Element => {
  const {
    original: { hasSelectionTracks },
  } = row;
  return (
    <Chip
      color={
        hasSelectionTracks ? CHIP_PROPS.COLOR.SUCCESS : CHIP_PROPS.COLOR.DEFAULT
      }
      label={hasSelectionTracks ? "Yes" : "No"}
      variant={CHIP_PROPS.VARIANT.STATUS}
    />
  );
};
