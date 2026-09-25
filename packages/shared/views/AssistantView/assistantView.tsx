import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Button } from "@mui/material";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import type { AssistantInfoResponse } from "@repo/shared/services/api-client/types";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { useAssistantChat } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/hook";
import { type JSX, useEffect, useState } from "react";
import { ChatPanel } from "./components/ChatPanel/chatPanel";
import { Layout as AssistantUILayout } from "./components/Layout/layout";
import { LegacyLayout } from "./components/LegacyLayout/legacyLayout";
import { LoganCohortCard } from "./components/LoganCohortCard/loganCohortCard";
import { SchemaPanel } from "./components/SchemaPanel/schemaPanel";
import type { Props } from "./types";
import { formatModelLabel, formatRetentionNotice } from "./utils";

export const AssistantView = ({
  initialLoganJobId,
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
    logan,
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
    initialLoganJobId,
    initialMessage,
    initialSessionId,
    sessionKey,
  });
  const [info, setInfo] = useState<AssistantInfoResponse | null>(null);
  const isAssistantUIEnabled = useFeatureFlag(FEATURE_FLAGS.ASSISTANT_UI);
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
  const Layout = isAssistantUIEnabled ? AssistantUILayout : LegacyLayout;

  return (
    <Layout
      slotProps={{
        chat: {
          children: (
            <ChatPanel
              error={error}
              introText={introText}
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
          ),
        },
        history: {
          disclaimer: (
            <>
              AI assistant — {modelLabel}. Your messages are sent to the model
              provider to generate a response, so avoid sharing sensitive or
              identifying information. Responses can be inaccurate; verify
              anything important before relying on it.{retentionNotice}
            </>
          ),
          feedbackButton: supportUrl && (
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
          ),
          newConversationButton: (
            <Button
              onClick={resetSession}
              size="small"
              startIcon={<RestartAltIcon />}
              sx={{ visibility: showReset ? "visible" : "hidden" }}
              variant="text"
            >
              New Conversation
            </Button>
          ),
        },
        setup: {
          children: (
            <>
              {logan && <LoganCohortCard logan={logan} />}
              <SchemaPanel handoffUrl={handoffUrl} schema={schema} />
            </>
          ),
        },
      }}
    />
  );
};
