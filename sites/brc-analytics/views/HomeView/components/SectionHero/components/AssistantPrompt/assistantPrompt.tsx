import { Input } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/input";
import { type JSX } from "react";
import { StyledForm } from "./assistantPrompt.styles";
import { INPUT_PROPS } from "./constants";
import { useAssistantPrompt } from "./hooks/UseAssistantPrompt/hook";

export const AssistantPrompt = (): JSX.Element => {
  const { isEmpty, onInput, onKeyDown, onSubmit } = useAssistantPrompt();
  return (
    <StyledForm onInput={onInput} onSubmit={onSubmit}>
      <Input {...INPUT_PROPS} disabled={isEmpty} onKeyDown={onKeyDown} />
    </StyledForm>
  );
};
