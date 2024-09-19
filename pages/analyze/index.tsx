import { smokeLightest } from "@databiosphere/findable-ui/lib/theme/common/palette";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { AnalyzeView } from "../../app/views/AnalyzeView/analyzeView";

export const Analyze = (): JSX.Element => {
  return <AnalyzeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageTitle: "Analyze",
      themeOptions: {
        palette: { background: { default: smokeLightest } },
      },
    },
  };
};

export default Analyze;

Analyze.Main = StyledPagesMain;
