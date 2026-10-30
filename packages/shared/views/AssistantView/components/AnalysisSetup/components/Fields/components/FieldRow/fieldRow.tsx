import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { type JSX } from "react";
import { FIELD_LABELS } from "./constants";
import { StyledStack } from "./fieldRow.styles";
import { useFocusRow } from "./hooks/UseFocusRow/hook";
import { FieldValueSelector } from "./selector/fieldValueSelector";
import type { FieldRowProps } from "./types";

/**
 * Renders one analysis schema field: its label, with its value on the right.
 * The row takes focus, though not a tab stop, when its chip is cleared from the
 * keyboard, so a keyboard or screen-reader user keeps their place.
 * @param props - Component props.
 * @param props.field - Field state.
 * @param props.fieldKey - Schema field key.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.onClearField - Clears a field without asking the assistant.
 * @param props.optional - Whether the field is optional for the chosen workflow.
 * @returns The field row element.
 */
export const FieldRow = ({
  field,
  fieldKey,
  loading,
  onClearField,
  optional,
}: FieldRowProps): JSX.Element => {
  const { focusRow, ref } = useFocusRow();

  return (
    <StyledStack direction={STACK_PROPS.DIRECTION.ROW} ref={ref} tabIndex={-1}>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
      >
        {FIELD_LABELS[fieldKey]}
      </Typography>
      <FieldValueSelector
        field={field}
        fieldKey={fieldKey}
        loading={loading}
        onClearField={onClearField}
        onKeyboardClear={focusRow}
        optional={optional}
      />
    </StyledStack>
  );
};
