import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { AssistantView } from "@/views/AssistantView/assistantView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { type GetStaticProps } from "next";
import { useRouter } from "next/router";
import { type JSX } from "react";

export const Assistant = (): JSX.Element => {
  const { query } = useRouter();
  const initialSessionId =
    typeof query.sessionId === "string" ? query.sessionId : undefined;

  return <AssistantView initialSessionId={initialSessionId} />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      ...BRC_PAGE_META.ASSISTANT,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } },
      },
    },
  };
};

export default Assistant;

Assistant.Main = StyledPagesMain;
