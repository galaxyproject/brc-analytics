import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Button } from "@mui/material";
import type { AssistantInfoResponse } from "@repo/shared/services/api-client/types";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { useAssistantChat } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/hook";
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
import { ChatPanel } from "./components/ChatPanel/chatPanel";
import { Headline } from "./components/Headline/headline";
import { SchemaPanel } from "./components/SchemaPanel/schemaPanel";

interface Props {
  initialMessage?: string;
  initialSessionId?: string;
  introText: string;
  sessionKey: string;
}

export const AssistantView = ({
  initialMessage,
  initialSessionId,
  introText,
  sessionKey,
}: Props): JSX.Element => {
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
  } = useAssistantChat({
    initialMessage,
    initialSessionId,
    sessionKey,
  });
  const [info, setInfo] = useState<AssistantInfoResponse | null>(null);
  // Read per-site via findable-ui's getConfig rather than importing one site's
  // config, so the button can never point at another tenant's form. supportUrl
  // is an app-level field absent from the base SiteConfig type.
  const { supportUrl } = getConfig() as { supportUrl?: string };

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
  const retentionNotice = formatRetentionNotice(info);

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
              introText={introText}
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
          AI assistant — {modelLabel}. Your messages are sent to the model
          provider to generate a response, so avoid sharing sensitive or
          identifying information. Responses can be inaccurate; verify anything
          important before relying on it.{retentionNotice}
        </AssistantDisclaimer>
      </SectionContent>
    </StyledSection>
  );
};

function formatRetentionNotice(info: AssistantInfoResponse | null): string {
  // Served by /info rather than hardcoded: the window is configurable and the
  // sweep can be off, and a stale privacy promise is worse than a vague one.
  const days = info?.turn_log_retention_days;
  // Explicit rather than `!days`: a negative window is a misconfiguration the
  // backend refuses to sweep, and must not render as "deleted after -1 days".
  if (days == null || days < 1) return "";
  return ` During the beta, conversations are logged so we can improve the assistant, then deleted after ${days} days.`;
}

function formatModelLabel(info: AssistantInfoResponse | null): string {
  if (info === null) return "powered by AI";
  if (!info.available) return "model not available";
  const parts: string[] = [];
  if (info.provider) parts.push(info.provider);
  if (info.model) parts.push(info.model);
  return parts.length > 0 ? `powered by ${parts.join(" / ")}` : "powered by AI";
}
