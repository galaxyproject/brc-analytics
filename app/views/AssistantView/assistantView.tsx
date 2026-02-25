import { Fragment, JSX } from "react";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import Error from "next/error";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { ChatPanel, SchemaPanel } from "../../components/Assistant";
import { useAssistantChat } from "../../hooks/useAssistantChat";
import { BREADCRUMBS } from "./common/constants";
import {
  AssistantSection,
  ChatColumn,
  SchemaColumn,
  TwoPanelLayout,
} from "./assistantView.styles";

export const AssistantView = (): JSX.Element => {
  const isAssistantEnabled = useFeatureFlag("assistant");
  const {
    error,
    handoffUrl,
    isComplete,
    loading,
    messages,
    schema,
    sendMessage,
    suggestions,
  } = useAssistantChat();

  if (!isAssistantEnabled) return <Error statusCode={404} />;

  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Analysis Assistant"
        subHead="Explore data and configure analyses with AI guidance"
      />
      <AssistantSection>
        <TwoPanelLayout>
          <ChatColumn>
            <ChatPanel
              error={error}
              loading={loading}
              messages={messages}
              onSend={sendMessage}
              suggestions={suggestions}
            />
          </ChatColumn>
          <SchemaColumn>
            <SchemaPanel
              handoffUrl={handoffUrl}
              isComplete={isComplete}
              schema={schema}
            />
          </SchemaColumn>
        </TwoPanelLayout>
      </AssistantSection>
    </Fragment>
  );
};
