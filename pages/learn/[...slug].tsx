import { GetStaticPaths, GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { LearnContentView } from "../../app/views/LearnContentView/learnContentView";

const Page = (): JSX.Element => {
  return <LearnContentView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    fallback: false,
    paths: [{ params: { slug: ["featured-analyses"] } }],
  };
};

export default Page;

Page.Main = StyledPagesMain;
