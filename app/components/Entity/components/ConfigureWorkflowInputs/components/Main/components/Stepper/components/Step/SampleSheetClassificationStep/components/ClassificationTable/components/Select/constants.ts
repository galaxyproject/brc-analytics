import { SelectProps } from "@mui/material";
import { COLUMN_TYPE } from "../../../../types";

export const SELECT_PROPS: SelectProps = {
  MenuProps: {
    slotProps: {
      paper: {
        elevation: 1,
        sx: { my: 1 },
        variant: "menu",
      },
    },
  },
  fullWidth: true,
  name: "classification",
  size: "small",
};

export const SINGLE_SELECT_TYPES = new Set([
  COLUMN_TYPE.IDENTIFIER,
  COLUMN_TYPE.FORWARD_FILE_URL,
  COLUMN_TYPE.REVERSE_FILE_URL,
]);
