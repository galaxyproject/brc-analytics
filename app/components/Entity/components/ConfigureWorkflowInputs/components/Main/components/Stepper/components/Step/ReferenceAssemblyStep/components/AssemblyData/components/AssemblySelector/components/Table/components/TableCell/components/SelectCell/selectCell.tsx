import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { Button, Tooltip } from "@mui/material";
import { CellContext } from "@tanstack/react-table";
import { JSX } from "react";
import { useStepContext } from "../../../../../../../../../../provider/hook";
import { Assembly } from "../../../../../../hooks/UseTable/types";

/**
 * Select cell component rendering a select button for an assembly row.
 * @param props - Component props.
 * @param props.row - Table row instance.
 * @returns Select cell component.
 */
export const SelectCell = ({
  row,
}: CellContext<Assembly, unknown>): JSX.Element => {
  const { onConfigure, onContinue, stepKey } = useStepContext();
  return (
    <Tooltip title={row.original.validation.error || null}>
      <span>
        <Button
          disabled={!row.getCanSelect()}
          color={BUTTON_PROPS.COLOR.PRIMARY}
          onClick={() => {
            if (row.getIsSelected()) {
              // Deselecting the row.
              row.toggleSelected(false);
              onConfigure({ [stepKey]: undefined });
              return;
            }
            row.toggleSelected(true);
            onConfigure({ [stepKey]: row.id });
            onContinue();
          }}
          variant={BUTTON_PROPS.VARIANT.CONTAINED}
        >
          Select
        </Button>
      </span>
    </Tooltip>
  );
};
