import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { JSX } from "react";
import { BRC_PAGE_META } from "../../app/common/meta/brc/constants";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { AssistantView } from "../../app/views/AssistantView/assistantView";

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
