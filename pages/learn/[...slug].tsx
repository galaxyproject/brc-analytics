import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { LearnContentView } from "../../app/views/LearnContentView/learnContentView";
import { buildStaticPaths } from "../../app/docs/common/staticGeneration/staticPaths";
import { buildStaticProps } from "../../app/docs/common/staticGeneration/staticProps";
import { buildSlug } from "../../app/docs/common/staticGeneration/utils";
import { StaticProps } from "../../app/docs/common/staticGeneration/types";

const SECTION = "learn";

const Page = (props: StaticProps): JSX.Element => {
  return <LearnContentView {...props} />;
};

export const getStaticProps: GetStaticProps = async (
  props: GetStaticPropsContext
) => {
  // Build the static props for the page.
  const staticProps = await buildStaticProps(buildSlug(props, SECTION));

  // If the static props are not found, return not found.
  if (!staticProps) return { notFound: true };

  // Return the static props.
  return staticProps;
};

export const getStaticPaths: GetStaticPaths = async () => {
  return { fallback: false, paths: buildStaticPaths([SECTION]) };
};

export default Page;

Page.Main = StyledPagesMain;
