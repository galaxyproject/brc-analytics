import { Input } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/input";
import { type JSX, useId } from "react";
import { StyledForm } from "./assistantPrompt.styles";
import { ExampleQueries } from "./components/ExampleQueries/exampleQueries";
import { INPUT_PROPS } from "./constants";
import { useAssistantPrompt } from "./hooks/UseAssistantPrompt/hook";

export const AssistantPrompt = (): JSX.Element => {
  const formId = useId();
  const { isEmpty, onInput, onKeyDown, onSubmit } = useAssistantPrompt();
  return (
    <StyledForm id={formId} onInput={onInput} onSubmit={onSubmit}>
      <Input {...INPUT_PROPS} disabled={isEmpty} onKeyDown={onKeyDown} />
      <ExampleQueries formId={formId} />
    </StyledForm>
  );
};
