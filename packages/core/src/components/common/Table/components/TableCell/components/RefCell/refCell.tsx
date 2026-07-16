import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { Chip } from "@mui/material";
import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";

interface BaseRowData {
  isRef: boolean;
}

export const RefCell = <TData extends BaseRowData = BaseRowData>({
  row,
}: CellContext<TData, unknown>): JSX.Element => {
  const {
    original: { isRef },
  } = row;
  return (
    <Chip
      color={isRef ? CHIP_PROPS.COLOR.SUCCESS : CHIP_PROPS.COLOR.DEFAULT}
      label={isRef ? "Yes" : "No"}
      variant={CHIP_PROPS.VARIANT.STATUS}
    />
  );
};
