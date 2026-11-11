import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Button } from "@mui/material";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import type { AssistantInfoResponse } from "@repo/shared/services/api-client/types";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { useAssistantChat } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/hook";
import { useConversationKey } from "@repo/shared/views/AssistantView/hooks/UseConversationKey/hook";
import { type JSX, useEffect, useState } from "react";
import { AnalysisSetup } from "./components/AnalysisSetup/analysisSetup";
import { TabLabel as SetupTabLabel } from "./components/AnalysisSetup/components/TabLabel/tabLabel";
import { ChatPanel } from "./components/ChatPanel/chatPanel";
import { Conversation } from "./components/Conversation/conversation";
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
  const { actions, state } = useAssistantChat({
    initialLoganJobId,
    initialMessage,
    initialSessionId,
    sessionKey,
  });
  const [info, setInfo] = useState<AssistantInfoResponse | null>(null);
  // Busy with a reply, or with a conversation restoring or opening: no
  // switching conversations or editing the setup over it.
  const isBusy = state.loading || state.isRestoring;
  const { conversationKey, onNewAnalysis, onOpenConversation } =
    useConversationKey(actions);
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
        conversationKey={conversationKey}
        slotProps={{
          chat: {
            children: (
              // Keyed by conversation, so an unsent draft doesn't follow the
              // user into the next one.
              <Conversation
                key={conversationKey}
                actions={actions}
                introText={introText}
                state={state}
              />
            ),
            tabLabel: "Chat",
          },
          history: {
            children: (
              <Sidebar
                disabled={isBusy}
                disclaimer={disclaimer}
                lastSave={state.lastSave}
                onNewAnalysis={onNewAnalysis}
                onOpenConversation={onOpenConversation}
                savedAnalysisId={state.savedAnalysisId}
                sessionId={state.shownSessionId}
                supportUrl={supportUrl}
              />
            ),
            tabLabel: "History",
          },
          setup: {
            // The new UI leaves out the Logan cohort card for now.
            children: (
              <AnalysisSetup
                handoffUrl={state.handoffUrl}
                loading={isBusy}
                onClearField={actions.onClearField}
                schema={state.schema}
              />
            ),
            tabLabel: (
              <SetupTabLabel
                handoffUrl={state.handoffUrl}
                schema={state.schema}
              />
            ),
          },
        }}
      />
    );
  }

  // On error there are no messages and no schema, which would hide Reset
  // exactly when it's the only way to clear a bad session id.
  const showReset =
    state.messages.length > 0 || state.schema !== null || state.error !== null;

  return (
    <LegacyLayout
      slotProps={{
        chat: {
          children: (
            <ChatPanel actions={actions} introText={introText} state={state} />
          ),
        },
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
              disabled={state.loading}
              onClick={actions.onResetSession}
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
              {state.logan && <LoganCohortCard logan={state.logan} />}
              <SchemaPanel
                handoffUrl={state.handoffUrl}
                schema={state.schema}
              />
            </>
          ),
        },
      }}
    />
  );
};
