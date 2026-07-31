import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { config } from "@/config/config";
import { LearnView } from "@brc/views/LearnView/learnView";
import type { PageProps } from "@pages/_app";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { ROUTES } from "@routes/constants";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <LearnView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle">
> = async () => {
  const { allowedPaths } = config();

  // Only build on sites where /learn is an allowed path.
  if (allowedPaths && !allowedPaths.includes(ROUTES.LEARN)) {
    return { notFound: true };
  }

  return {
    props: {
      ...BRC_PAGE_META.LEARN,
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
