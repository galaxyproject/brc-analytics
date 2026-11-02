import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { TOOLTIP_PROPS } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/RowSelectionCell/constants";
import { Button, DialogActions, DialogContent, Tooltip } from "@mui/material";
import { ColumnFilters } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/ColumnFilters/columnFilters";
import { StyledDialog } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/SelectorDialog/selectorDialog.styles";
import { Table } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/Table/table";
import { type JSX } from "react";
import { type Props } from "./types";
import {
  addSelection,
  buildRowSelection,
  getAddSelectionValidation,
  getRowSelectionCount,
  renderButtonText,
} from "./utils";

/**
 * Assemblies selector dialog for browsing and selecting the organism's
 * assemblies. The selection is only configured when the user adds it, which
 * needs at least the workflow's required number of assemblies; closing the
 * dialog discards it.
 * @param props - Component props.
 * @param props.fastaCollection - Configured assembly accessions.
 * @param props.onClose - Callback to close the dialog.
 * @param props.onConfigure - Callback to configure workflow input.
 * @param props.open - Whether the dialog is open.
 * @param props.referenceAssembly - Configured reference assembly accession, if any.
 * @param props.stepKey - Key identifying the configured input field.
 * @param props.table - Assemblies table instance.
 * @param props.workflow - Workflow entity.
 * @returns Assemblies selector dialog component.
 */
export const AssembliesSelector = ({
  fastaCollection,
  onClose,
  onConfigure,
  open,
  referenceAssembly,
  stepKey,
  table,
  workflow,
}: Props): JSX.Element => {
  const count = getRowSelectionCount(table);
  const addValidation = getAddSelectionValidation(count, workflow);
  return (
    <StyledDialog
      onClose={onClose}
      // Starts the selection from the configured assemblies each time the dialog opens.
      onTransitionEnter={() =>
        table.setRowSelection(buildRowSelection(fastaCollection))
      }
      // Resets filters to initial state after the dialog close animation completes.
      onTransitionExited={() => table.resetColumnFilters()}
      open={open}
    >
      <DialogTitle onClose={onClose} title="Select Assemblies" />
      <DialogContent>
        <ColumnFilters table={table} />
        <Table table={table} />
      </DialogContent>
      <DialogActions>
        <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onClose}>
          Cancel
        </Button>
        <Tooltip {...TOOLTIP_PROPS} title={addValidation}>
          <span>
            <Button
              {...BUTTON_PROPS.PRIMARY_CONTAINED}
              disabled={!!addValidation}
              onClick={() =>
                addSelection(
                  table,
                  stepKey,
                  referenceAssembly,
                  onConfigure,
                  onClose
                )
              }
            >
              {renderButtonText(count)}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </StyledDialog>
  );
};
