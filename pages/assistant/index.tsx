import { JSX } from "react";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { AssistantView } from "../../app/views/AssistantView/assistantView";

export const Assistant = (): JSX.Element => {
  return <AssistantView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageDescription:
        "Get AI-assisted help with genomic analysis on BRC Analytics.",
      pageTitle: "Analysis Assistant",
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } },
      },
    },
  };
};

export default Assistant;

Assistant.Main = StyledPagesMain;
