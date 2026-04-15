import { JSX } from "react";
import { LearnView } from "../../app/views/LearnView/learnView";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { PageProps } from "../_app";

const Page = (): JSX.Element => {
  return <LearnView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle">
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
