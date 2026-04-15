import { JSX } from "react";
import { LearnView } from "../../app/views/LearnView/learnView";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { StaticProps } from "../../app/docs/common/staticGeneration/types";

const Page = (): JSX.Element => {
  return <LearnView />;
};

export const getStaticProps: GetStaticProps<
  Pick<StaticProps, "pageTitle">
> = async () => {
  return {
    props: {
      pageDescription:
        "Learn about genomic analysis tools, workflows, and best practices on BRC Analytics.",
      pageTitle: "Learn About BRC Analytics",
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
