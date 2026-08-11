import { LoganSearchView } from "@brc/views/LoganSearchView/loganSearchView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

export const LoganSearchPage = (): JSX.Element => {
  return <LoganSearchView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageTitle: "Logan Search",
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default LoganSearchPage;

LoganSearchPage.Main = StyledPagesMain;
