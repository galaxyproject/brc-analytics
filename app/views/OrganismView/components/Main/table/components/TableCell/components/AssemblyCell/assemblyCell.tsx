import type { PangenomeMember } from "@/apis/catalog/brc-analytics-catalog/common/pangenome";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Chip, Stack, Typography } from "@mui/material";
import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";

/**
 * Assembly cell for the pangenome members table: the member name, an optional
 * "Anchor" chip on the reference anchor, then the accession — matching the
 * assemblies-table cell layout.
 * @param props - Component props.
 * @param props.row - Row context.
 * @returns The assembly cell.
 */
export const AssemblyCell = ({
  row,
}: CellContext<PangenomeMember, unknown>): JSX.Element => {
  const { original } = row;
  const { accession, isAnchor, name } = original;
  return (
    <Stack spacing={2} useFlexGap>
      <Stack direction={STACK_PROPS.DIRECTION.ROW} spacing={2} useFlexGap>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          {name}
        </Typography>
        {isAnchor && (
          <Chip
            color={CHIP_PROPS.COLOR.INFO}
            label="Anchor"
            size={CHIP_PROPS.SIZE.SMALL}
            variant={CHIP_PROPS.VARIANT.STATUS}
          />
        )}
      </Stack>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
      >
        {accession}
      </Typography>
    </Stack>
  );
};
