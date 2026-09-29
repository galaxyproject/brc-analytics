import { FieldGroup } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldGroup/fieldGroup";
import { FIELD_GROUPS } from "@repo/shared/views/AssistantView/components/AnalysisSetup/constants";
import { Fragment, type JSX } from "react";
import { StyledDivider } from "./fields.styles";
import type { FieldsProps } from "./types";

/**
 * Renders the analysis schema fields, group by group, divided.
 * @param props - Component props.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.onSend - Sends a message to the assistant.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @returns The field groups.
 */
export const Fields = ({
  loading,
  onSend,
  schema,
}: FieldsProps): JSX.Element => {
  return (
    <Fragment>
      {FIELD_GROUPS.map((group, index) => (
        <Fragment key={group.label}>
          {index > 0 && <StyledDivider />}
          <FieldGroup
            group={group}
            loading={loading}
            onSend={onSend}
            schema={schema}
          />
        </Fragment>
      ))}
    </Fragment>
  );
};
