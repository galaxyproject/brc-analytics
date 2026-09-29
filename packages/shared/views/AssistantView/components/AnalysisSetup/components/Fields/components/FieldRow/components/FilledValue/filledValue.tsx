import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { CloseRounded } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useChipTooltipTitle } from "@repo/shared/hooks/UseChipTooltipTitle/hook";
import { type JSX } from "react";
import { CLEARABLE_FIELDS, TOOLTIP_PROPS } from "./constants";
import { StyledChip, StyledSpan } from "./filledValue.styles";
import { useClearField } from "./hooks/UseClearField/hook";
import type { FilledValueProps } from "./types";
import { getFieldLabel } from "./utils";

/**
 * Renders a set field's value as a chip, removable with its × when the user
 * chose it in conversation. Derived fields are recomputed every turn, so theirs
 * has no ×. The × is disabled while a reply is in flight, since a clear sent
 * then would be dropped; the chip is wrapped so its tooltip still opens then.
 * @param props - Component props.
 * @param props.field - Field state.
 * @param props.fieldKey - Schema field key.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.onSend - Sends a message to the assistant.
 * @returns The filled value element.
 */
export const FilledValue = ({
  field,
  fieldKey,
  loading,
  onSend,
}: FilledValueProps): JSX.Element => {
  const { onClear } = useClearField(fieldKey, loading, onSend);
  const clearable = CLEARABLE_FIELDS.has(fieldKey);
  const label = getFieldLabel(fieldKey, field);
  const { ref, title } = useChipTooltipTitle(label);

  return (
    <Tooltip {...TOOLTIP_PROPS} title={title}>
      <StyledSpan>
        <StyledChip
          color={CHIP_PROPS.COLOR.PRIMARY}
          disabled={clearable && loading}
          deleteIcon={<CloseRounded color={SVG_ICON_PROPS.COLOR.INHERIT} />}
          label={label}
          onDelete={clearable ? onClear : undefined}
          ref={ref}
          size={CHIP_PROPS.SIZE.MEDIUM}
        />
      </StyledSpan>
    </Tooltip>
  );
};
