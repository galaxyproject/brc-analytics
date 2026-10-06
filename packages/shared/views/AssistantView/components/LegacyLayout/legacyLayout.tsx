import { Headline } from "@repo/shared/views/AssistantView/components/Headline/headline";
import { type JSX } from "react";
import {
  ActionsRow,
  AssistantDisclaimer,
  ChatColumn,
  SchemaColumn,
  SectionContent,
  StyledSection,
  TwoPanelLayout,
} from "./legacyLayout.styles";
import type { LegacyLayoutProps } from "./types";

/**
 * Two-panel assistant layout (chat beside analysis setup), rendered while the
 * assistant-ui feature flag is off.
 * @param props - Layout props.
 * @param props.slotProps - Props for each slot.
 * @returns Legacy assistant layout.
 */
export const LegacyLayout = ({ slotProps }: LegacyLayoutProps): JSX.Element => {
  const { chat, history, setup } = slotProps;
  return (
    <StyledSection>
      <SectionContent>
        <Headline />
        <ActionsRow>
          {history.newConversationButton}
          {history.feedbackButton}
        </ActionsRow>
        <TwoPanelLayout>
          <ChatColumn>{chat.children}</ChatColumn>
          <SchemaColumn>{setup.children}</SchemaColumn>
        </TwoPanelLayout>
        <AssistantDisclaimer>{history.disclaimer}</AssistantDisclaimer>
      </SectionContent>
    </StyledSection>
  );
};
