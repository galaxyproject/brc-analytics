import { DIALOG_CLOSE_REASON } from "./constants";
import { type DialogCloseReason } from "./types";

/**
 * Closes the dialog unless the close came from a click on its backdrop.
 * A click outside an open column filter reaches the backdrop, so closing on it
 * would throw away the selection the user is building.
 * @param onClose - Callback to close the dialog.
 * @param reason - Why the dialog asked to close.
 */
export function closeUnlessBackdropClick(
  onClose: () => void,
  reason: DialogCloseReason
): void {
  if (reason === DIALOG_CLOSE_REASON.BACKDROP_CLICK) return;
  onClose();
}
