import { type JSX } from "react";
import { StyledDialog } from "./selectorDialog.styles";
import { type Props } from "./types";
import { closeUnlessBackdropClick } from "./utils";

/**
 * Dialog for picking rows from a filterable table. It closes from its own
 * controls and Escape, not from a click on its backdrop.
 * @param props - Dialog props.
 * @param props.onClose - Callback to close the dialog.
 * @returns Selector dialog component.
 */
export const SelectorDialog = ({ onClose, ...props }: Props): JSX.Element => {
  return (
    <StyledDialog
      {...props}
      onClose={(_, reason) => closeUnlessBackdropClick(onClose, reason)}
    />
  );
};
