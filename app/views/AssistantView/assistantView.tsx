import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { Box, Button } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Error from "next/error";
import { Fragment, JSX } from "react";
import { ChatPanel, SchemaPanel } from "../../components/Assistant";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { useAssistantChat } from "../../hooks/useAssistantChat";
import {
  AssistantSection,
  ChatColumn,
  SchemaColumn,
  SectionContent,
  TwoPanelLayout,
} from "./assistantView.styles";
import { BREADCRUMBS } from "./common/constants";

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

  if (!isAssistantEnabled) return <Error statusCode={404} />;

  const showReset = messages.length > 0 || schema !== null;

  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Analysis Assistant"
        subHead="Explore data and configure analyses with AI guidance"
      />
      <AssistantSection>
        <SectionContent>
          {showReset && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", pb: 1 }}>
              <Button
                onClick={resetSession}
                size="small"
                startIcon={<RestartAltIcon />}
                variant="text"
              >
                New Conversation
              </Button>
            </Box>
          )}
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
        </SectionContent>
      </AssistantSection>
    </Fragment>
  );
};
