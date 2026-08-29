import { BRC_PAGE_META } from "@brc/meta/constants";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import type { ThemedPageProps } from "@repo/shared/meta/types";
import { SMOKE_LIGHTEST } from "@repo/shared/styles/palette";
import { AssistantView } from "@repo/shared/views/AssistantView/assistantView";
import { ASSISTANT_QUERY_PARAM } from "@repo/shared/views/AssistantView/constants";
import { type GetStaticProps } from "next";
import { useRouter } from "next/router";
import { type JSX } from "react";

// localStorage key for the assistant session id. Must stay stable so existing
// users' saved sessions keep resolving.
const SESSION_KEY = "brc-assistant-session-id";

const INTRO_TEXT =
  "Welcome! I can help you explore the BRC catalog -- organisms, assemblies, and workflows -- and set up an analysis to run in Galaxy. Try naming an organism or an analysis type to get started.";

const Page = (): JSX.Element => {
  const { query } = useRouter();
  const initialMessage = query[ASSISTANT_QUERY_PARAM.QUESTION];
  const initialSessionId = query[ASSISTANT_QUERY_PARAM.SESSION_ID];
  const initialLoganJobId = query[ASSISTANT_QUERY_PARAM.LOGAN_JOB];

  return (
    <AssistantView
      initialLoganJobId={
        typeof initialLoganJobId === "string" ? initialLoganJobId : undefined
      }
      initialMessage={
        typeof initialMessage === "string" ? initialMessage : undefined
      }
      initialSessionId={
        typeof initialSessionId === "string" ? initialSessionId : undefined
      }
      introText={INTRO_TEXT}
      sessionKey={SESSION_KEY}
    />
  );
};

export const getStaticProps: GetStaticProps<ThemedPageProps> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.ASSISTANT,
      themeOptions: {
        palette: { background: { default: SMOKE_LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
