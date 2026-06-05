import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Button } from "@mui/material";
import Error from "next/error";
import { JSX, useEffect, useState } from "react";
import { ChatPanel, SchemaPanel } from "../../components/Assistant";
import { useAssistantChat } from "../../hooks/useAssistantChat";
import { llmAPIClient } from "../../services/llm-api-client";
import { AssistantInfoResponse } from "../../types/api";
import {
  AssistantDisclaimer,
  ChatColumn,
  SchemaColumn,
  SectionContent,
  StyledSection,
  TwoPanelLayout,
} from "./assistantView.styles";
import { Headline } from "./components/Headline/headline";

export const AssistantView = (): JSX.Element => {
  const isAssistantEnabled = useFeatureFlag("assistant");
  const {
    error,
    handoffUrl,
    isRestoring,
    loading,
    messages,
    onRetry,
    resetSession,
    schema,
    sendMessage,
    suggestions,
  } = useAssistantChat();
  const [info, setInfo] = useState<AssistantInfoResponse | null>(null);

  useEffect(() => {
    if (!isAssistantEnabled) return;
    let cancelled = false;
    llmAPIClient
      .assistantInfo()
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        // Non-critical; disclaimer just falls back to a generic label.
      });
    return (): void => {
      cancelled = true;
    };
  }, [isAssistantEnabled]);

  if (!isAssistantEnabled) return <Error statusCode={404} />;

  const showReset = messages.length > 0 || schema !== null;
  const modelLabel = formatModelLabel(info);

  return (
    <StyledSection>
      <SectionContent>
        <Headline />
        <Button
          onClick={resetSession}
          size="small"
          startIcon={<RestartAltIcon />}
          sx={{ visibility: showReset ? "visible" : "hidden" }}
          variant="text"
        >
          New Conversation
        </Button>
        <TwoPanelLayout>
          <ChatColumn>
            <ChatPanel
              error={error}
              isRestoring={isRestoring}
              loading={loading}
              messages={messages}
              onRetry={onRetry}
              onSend={sendMessage}
              suggestions={suggestions}
            />
          </ChatColumn>
          <SchemaColumn>
            <SchemaPanel handoffUrl={handoffUrl} schema={schema} />
          </SchemaColumn>
        </TwoPanelLayout>
        <AssistantDisclaimer>
          AI assistant — {modelLabel}. Responses can be inaccurate; verify
          anything important before relying on it.
        </AssistantDisclaimer>
      </SectionContent>
    </StyledSection>
  );
};

function formatModelLabel(info: AssistantInfoResponse | null): string {
  if (info === null) return "powered by AI";
  if (!info.available) return "model not available";
  const parts: string[] = [];
  if (info.provider) parts.push(info.provider);
  if (info.model) parts.push(info.model);
  return parts.length > 0 ? `powered by ${parts.join(" / ")}` : "powered by AI";
}
