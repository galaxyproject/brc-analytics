import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack } from "@mui/material";
import { FieldRow } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/fieldRow";
import { getField } from "@repo/shared/views/AssistantView/components/AnalysisSetup/utils";
import { type JSX } from "react";
import { StyledTypography } from "./fieldGroup.styles";
import type { FieldGroupProps } from "./types";

/**
 * Renders a titled group of analysis schema fields, one row per field.
 * @param props - Component props.
 * @param props.group - Field group.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.onClearField - Clears a field without asking the assistant.
 * @param props.schema - Current analysis schema, or null.
 * @returns The field group element.
 */
export const FieldGroup = ({
  group,
  loading,
  onClearField,
  schema,
}: FieldGroupProps): JSX.Element => {
  return (
    <Stack>
      <StyledTypography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        component="h3"
        variant={TYPOGRAPHY_PROPS.VARIANT.UPPERCASE_500}
      >
        {group.label}
      </StyledTypography>
      {group.fields.map((fieldKey) => (
        <FieldRow
          key={fieldKey}
          field={getField(schema, fieldKey)}
          fieldKey={fieldKey}
          loading={loading}
          onClearField={onClearField}
        />
      ))}
    </Stack>
  );
};
