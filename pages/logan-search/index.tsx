import { StyledPagesMain } from "@/components/Layout/components/Main/main.styles";
import { LoganSearchView } from "@/views/LoganSearchView/loganSearchView";
import { GetStaticProps } from "next";
import { JSX } from "react";

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
