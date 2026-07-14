import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { StyledPagesMain } from "@/components/Layout/components/Main/main.styles";
import { AssistantView } from "@/views/AssistantView/assistantView";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { JSX } from "react";

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
