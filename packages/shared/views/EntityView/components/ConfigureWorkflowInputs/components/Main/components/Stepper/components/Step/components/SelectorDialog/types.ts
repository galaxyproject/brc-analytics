import { type DialogProps } from "@mui/material";

export type DialogCloseReason = Parameters<
  NonNullable<DialogProps["onClose"]>
>[1];

export interface Props extends Omit<DialogProps, "onClose"> {
  onClose: () => void;
}
