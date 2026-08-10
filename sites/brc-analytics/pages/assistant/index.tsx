import { BRC_PAGE_META } from "@brc/meta/constants";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import type { PageMeta } from "@repo/shared/meta/types";
import { AssistantView } from "@repo/shared/views/AssistantView/assistantView";
import { type GetStaticProps } from "next";
import { useRouter } from "next/router";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  const { query } = useRouter();
  const initialSessionId =
    typeof query.sessionId === "string" ? query.sessionId : undefined;

  return <AssistantView initialSessionId={initialSessionId} />;
};

export const getStaticProps: GetStaticProps<
  PageMeta & {
    themeOptions: object;
  }
> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.ASSISTANT,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
