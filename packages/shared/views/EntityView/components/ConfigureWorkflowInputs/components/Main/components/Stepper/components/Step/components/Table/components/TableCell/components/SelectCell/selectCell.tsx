import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { Button } from "@mui/material";
import { useStepContext } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/providers/SelectorStep/hook";
import { DEFAULT_CONFIGURED_INPUT } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/constants";
import { type CellContext, type RowData } from "@tanstack/react-table";
import { type JSX } from "react";

/**
 * Select cell component rendering a select button for a selector table row.
 * Selecting a row configures the step's input with the row id.
 * @param props - Component props.
 * @param props.row - Table row instance.
 * @param props.table - Table instance.
 * @returns Select cell component.
 */
export const SelectCell = <T extends RowData>({
  row,
  table,
}: CellContext<T, unknown>): JSX.Element => {
  const { onConfigure, onContinue, stepKey } = useStepContext();
  return (
    <Button
      color={BUTTON_PROPS.COLOR.PRIMARY}
      onClick={() => {
        if (row.getIsSelected()) {
          // Deselecting the row — wipe everything: user is starting over.
          row.toggleSelected(false);
          onConfigure(DEFAULT_CONFIGURED_INPUT);
          return;
        }
        // Switching to a new row — wipe everything else so stale inputs
        // configured for the previous selection don't leak through.
        row.toggleSelected(true);
        onConfigure({ ...DEFAULT_CONFIGURED_INPUT, [stepKey]: row.id });
        onContinue();
        // Resets filters to initial state after a selection is made and the dialog is closed, ensuring the next time the dialog is opened, it shows the initial list of rows.
        // The timeout ensures this runs after the dialog close animation completes.
        setTimeout(() => table.resetColumnFilters(), 1000);
      }}
      variant={BUTTON_PROPS.VARIANT.CONTAINED}
    >
      Select
    </Button>
  );
};
