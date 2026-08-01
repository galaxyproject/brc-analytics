import { ChatPanel, SchemaPanel } from "@/components/Assistant";
import { config } from "@/config/config";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import { assistantAPIClient } from "@/services/assistant-api-client";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Button } from "@mui/material";
import type { AssistantInfoResponse } from "@repo/shared/services/api-client/types";
import { type JSX, useEffect, useState } from "react";
import {
  ActionsRow,
  AssistantDisclaimer,
  ChatColumn,
  SchemaColumn,
  SectionContent,
  StyledSection,
  TwoPanelLayout,
} from "./assistantView.styles";
import { Headline } from "./components/Headline/headline";

interface Props {
  initialSessionId?: string;
}

export const AssistantView = ({ initialSessionId }: Props): JSX.Element => {
  const {
    error,
    handoffUrl,
    isRestoring,
    loading,
    messages,
    onRetry,
    resetSession,
    saveAnalysis,
    saveLoading,
    saveMessage,
    schema,
    sendMessage,
    suggestions,
  } = useAssistantChat({
    initialSessionId,
  });
  const [info, setInfo] = useState<AssistantInfoResponse | null>(null);
  // Read per-site rather than importing one site's config, so the button can
  // never point at another tenant's form.
  const { supportUrl } = config();

  useEffect(() => {
    let cancelled = false;
    assistantAPIClient
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
  }, []);

  // On error there are no messages and no schema, which would hide Reset
  // exactly when it's the only way to clear a bad session id.
  const showReset = messages.length > 0 || schema !== null || error !== null;
  const modelLabel = formatModelLabel(info);

  return (
    <StyledSection>
      <SectionContent>
        <Headline />
        <ActionsRow>
          <Button
            onClick={resetSession}
            size="small"
            startIcon={<RestartAltIcon />}
            sx={{ visibility: showReset ? "visible" : "hidden" }}
            variant="text"
          >
            New Conversation
          </Button>
          {supportUrl && (
            <Button
              aria-label="Give feedback on the Analysis Assistant (opens in a new tab)"
              component="a"
              href={supportUrl}
              rel="noopener noreferrer"
              size="small"
              startIcon={<FeedbackOutlinedIcon />}
              target="_blank"
              variant="outlined"
            >
              Feedback
            </Button>
          )}
        </ActionsRow>
        <TwoPanelLayout>
          <ChatColumn>
            <ChatPanel
              error={error}
              isRestoring={isRestoring}
              loading={loading}
              messages={messages}
              onRetry={onRetry}
              onSave={saveAnalysis}
              onSend={sendMessage}
              saveLabel={saveMessage}
              saveLoading={saveLoading}
              suggestions={suggestions}
            />
          </ChatColumn>
          <SchemaColumn>
            <SchemaPanel handoffUrl={handoffUrl} schema={schema} />
          </SchemaColumn>
        </TwoPanelLayout>
        <AssistantDisclaimer>
          AI assistant — {modelLabel}. Your messages are sent to the model
          provider to generate a response, so avoid sharing sensitive or
          identifying information. Responses can be inaccurate; verify anything
          important before relying on it.
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
