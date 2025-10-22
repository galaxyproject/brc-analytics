import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { LearnContentView } from "../../app/views/LearnContentView/learnContentView";
import { buildStaticPaths } from "../../app/docs/common/staticGeneration/staticPaths";
import { buildStaticProps } from "../../app/docs/common/staticGeneration/staticProps";
import {
  buildSlug,
  sanitizeStaticProps,
} from "../../app/docs/common/staticGeneration/utils";
import { StaticProps } from "../../app/docs/common/staticGeneration/types";

const SECTION = "learn";

const Page = (props: StaticProps): JSX.Element => {
  return <LearnContentView {...props} />;
};

export const getStaticProps: GetStaticProps<StaticProps> = async (
  props: GetStaticPropsContext
) => {
  // Build the static props for the page.
  const staticProps = await buildStaticProps(
    buildSlug(props, SECTION),
    undefined,
    undefined
  );

  // If the static props are not found, return not found.
  if (!staticProps) return { notFound: true };

  // Return the static props.
  return sanitizeStaticProps(staticProps);
};

export const getStaticPaths: GetStaticPaths = async () => {
  return { fallback: false, paths: buildStaticPaths([SECTION]) };
};

export default Page;

Page.Main = StyledPagesMain;
