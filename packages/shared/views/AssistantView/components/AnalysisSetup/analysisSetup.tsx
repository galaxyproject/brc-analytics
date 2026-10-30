import { Stack } from "@mui/material";
import { type JSX } from "react";
import { Action } from "./components/Action/action";
import { ACTION_PLACEMENT } from "./components/Action/constants";
import { Fields } from "./components/Fields/fields";
import { Header } from "./components/Header/header";
import { Progress } from "./components/Progress/progress";
import type { AnalysisSetupProps } from "./types";

/**
 * Analysis setup panel: the fields the assistant has set so far, grouped by
 * target, analysis and data, with a count and progress bar, and the handoff to
 * workflow setup once every required field is set. The handoff is rendered at
 * the panel's end, and also at its start once the schema is complete, with
 * only the copy for the screen width shown, so its place in the focus order
 * matches where it appears.
 * @param props - Component props.
 * @param props.handoffUrl - Workflow setup URL, or null until the schema is complete.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.onClearField - Clears a field without asking the assistant.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @returns The analysis setup panel element.
 */
export const AnalysisSetup = ({
  handoffUrl,
  loading,
  onClearField,
  schema,
}: AnalysisSetupProps): JSX.Element => {
  return (
    <Stack>
      {handoffUrl && (
        <Action
          handoffUrl={handoffUrl}
          loading={loading}
          placement={ACTION_PLACEMENT.START}
          schema={schema}
        />
      )}
      <Header schema={schema} />
      <Progress schema={schema} />
      <Fields loading={loading} onClearField={onClearField} schema={schema} />
      <Action
        handoffUrl={handoffUrl}
        loading={loading}
        placement={ACTION_PLACEMENT.END}
        schema={schema}
      />
    </Stack>
  );
};
