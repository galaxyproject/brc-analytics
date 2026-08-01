import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { config } from "@/config/config";
import { AssistantView } from "@/views/AssistantView/assistantView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { ROUTES } from "@routes/constants";
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
  const { allowedPaths } = config();

  // Only build on sites where /assistant is an allowed path.
  if (allowedPaths && !allowedPaths.includes(ROUTES.ASSISTANT)) {
    return { notFound: true };
  }

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
