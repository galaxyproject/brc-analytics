import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { type JSX } from "react";
import { FIELD_LABELS } from "./constants";
import { StyledStack } from "./fieldRow.styles";
import { FieldValueSelector } from "./selector/fieldValueSelector";
import type { FieldRowProps } from "./types";

/**
 * Renders one analysis schema field: its label, with its value on the right.
 * @param props - Component props.
 * @param props.field - Field state.
 * @param props.fieldKey - Schema field key.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.onClearField - Clears a field without asking the assistant.
 * @returns The field row element.
 */
export const FieldRow = ({
  field,
  fieldKey,
  loading,
  onClearField,
}: FieldRowProps): JSX.Element => {
  return (
    <StyledStack direction={STACK_PROPS.DIRECTION.ROW}>
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
      />
    </StyledStack>
  );
};
