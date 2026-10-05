import { AttentionValue } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/AttentionValue/attentionValue";
import { EmptyValue } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/EmptyValue/emptyValue";
import { FilledValue } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/FilledValue/filledValue";
import { FIELD_STATUS } from "@repo/shared/views/AssistantView/components/AnalysisSetup/constants";
import { type JSX } from "react";
import type { FieldValueSelectorProps } from "./types";

/**
 * Selects and renders the appropriate field value component based on field status.
 *
 * Available statuses:
 * - `FILLED`: Displays the value as a chip.
 * - `NEEDS_ATTENTION`: Displays the reason the field needs attention.
 * - `EMPTY`, or any status this panel doesn't know: Displays "Not set". The
 *   backend deploys separately, so a new status degrades to unset rather
 *   than rendering a blank value.
 *
 * @param props - Component props.
 * @param props.field - Field state.
 * @param props.fieldKey - Schema field key.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.onSend - Sends a message to the assistant.
 * @returns The selected field value component.
 */
export const FieldValueSelector = ({
  field,
  fieldKey,
  loading,
  onSend,
}: FieldValueSelectorProps): JSX.Element => {
  switch (field.status) {
    case FIELD_STATUS.FILLED:
      return (
        <FilledValue
          field={field}
          fieldKey={fieldKey}
          loading={loading}
          onSend={onSend}
        />
      );
    case FIELD_STATUS.NEEDS_ATTENTION:
      return <AttentionValue field={field} />;
    default:
      return <EmptyValue />;
  }
};
