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
import { AnalysisSetup } from "./components/AnalysisSetup/analysisSetup";
import { ChatPanel } from "./components/ChatPanel/chatPanel";
import { Layout as AssistantUILayout } from "./components/Layout/layout";
import { LegacyLayout } from "./components/LegacyLayout/legacyLayout";
import { LoganCohortCard } from "./components/LoganCohortCard/loganCohortCard";
import { SchemaPanel } from "./components/SchemaPanel/schemaPanel";
import { Sidebar } from "./components/Sidebar/sidebar";
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
    isSaved,
    lastSave,
    loading,
    logan,
    messages,
    onRetry,
    resetSession,
    retryRestore,
    schema,
    sendMessage,
    shownSessionId,
    suggestions,
  } = useAssistantChat({
    initialLoganJobId,
    initialMessage,
    initialSessionId,
    sessionKey,
  });
  const [info, setInfo] = useState<AssistantInfoResponse | null>(null);
  // A conversation opening from the history: until its restore takes over,
  // nothing else may start or send, or the open would wipe it.
  const [isOpening, setIsOpening] = useState(false);
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

  const modelLabel = formatModelLabel(info);
  const retentionNotice = formatRetentionNotice(info);
  const chat = {
    children: (
      <ChatPanel
        error={error}
        introText={introText}
        isRestoring={isRestoring || isOpening}
        isSaved={isSaved}
        loading={loading}
        messages={messages}
        onRetry={onRetry}
        onSend={sendMessage}
        suggestions={suggestions}
      />
    ),
  };
  const disclaimer = (
    <>
      AI assistant — {modelLabel}. Your messages are sent to the model provider
      to generate a response, so avoid sharing sensitive or identifying
      information. Responses can be inaccurate; verify anything important before
      relying on it.{retentionNotice}
    </>
  );

  if (isAssistantUIEnabled) {
    return (
      <AssistantUILayout
        slotProps={{
          chat,
          history: {
            children: (
              <Sidebar
                disabled={loading || isRestoring || isOpening}
                disclaimer={disclaimer}
                lastSave={lastSave}
                onNewAnalysis={resetSession}
                onOpeningChange={setIsOpening}
                onRetryRestore={retryRestore}
                sessionId={shownSessionId}
                supportUrl={supportUrl}
              />
            ),
          },
          setup: {
            // The new UI leaves out the Logan cohort card for now.
            children: (
              <AnalysisSetup
                handoffUrl={handoffUrl}
                loading={loading || isRestoring || isOpening}
                onSend={sendMessage}
                schema={schema}
              />
            ),
          },
        }}
      />
    );
  }

  // On error there are no messages and no schema, which would hide Reset
  // exactly when it's the only way to clear a bad session id.
  const showReset = messages.length > 0 || schema !== null || error !== null;

  return (
    <LegacyLayout
      slotProps={{
        chat,
        history: {
          disclaimer,
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
            // Not mid-reply: the late reply would re-bind the session cookie
            // to the conversation left behind, locking out the new one.
            <Button
              disabled={loading}
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
