import { Stack } from "@mui/material";
import { type JSX } from "react";
import { Action } from "./components/Action/action";
import { Fields } from "./components/Fields/fields";
import { Header } from "./components/Header/header";
import { Progress } from "./components/Progress/progress";
import type { AnalysisSetupProps } from "./types";

/**
 * Analysis setup panel: the fields the assistant has set so far, grouped by
 * target, analysis and data, with a count and progress bar, and the handoff to
 * workflow setup once every required field is set.
 * @param props - Component props.
 * @param props.handoffUrl - Workflow setup URL, or null until the schema is complete.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.onSend - Sends a message to the assistant.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @returns The analysis setup panel element.
 */
export const AnalysisSetup = ({
  handoffUrl,
  loading,
  onSend,
  schema,
}: AnalysisSetupProps): JSX.Element => {
  return (
    <Stack>
      <Header schema={schema} />
      <Progress schema={schema} />
      <Fields loading={loading} onSend={onSend} schema={schema} />
      <Action handoffUrl={handoffUrl} loading={loading} schema={schema} />
    </Stack>
  );
};
