import { Input } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/input";
import { type JSX, useId } from "react";
import { StyledAssistantPrompt, StyledForm } from "./assistantPrompt.styles";
import { ExampleQueries } from "./components/ExampleQueries/exampleQueries";
import { INPUT_PROPS } from "./constants";
import { useAssistantPrompt } from "./hooks/UseAssistantPrompt/hook";

export const AssistantPrompt = (): JSX.Element => {
  const formId = useId();
  const { isEmpty, onInput, onKeyDown, onSubmit } = useAssistantPrompt();
  return (
    <StyledAssistantPrompt>
      <StyledForm id={formId} onInput={onInput} onSubmit={onSubmit}>
        <Input {...INPUT_PROPS} disabled={isEmpty} onKeyDown={onKeyDown} />
      </StyledForm>
      <ExampleQueries formId={formId} />
    </StyledAssistantPrompt>
  );
};
