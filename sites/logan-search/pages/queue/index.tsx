import { LOGAN_PAGE_META } from "@logan/meta/constants";
import { SMOKE } from "@logan/theme/options/palette";
import { QueueStatsView } from "@logan/views/QueueStatsView/queueStatsView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { type GetStaticProps } from "next";
import Head from "next/head";
import { type JSX } from "react";

// Unlisted: nothing links here, and search engines are asked not to index it.
const Page = (): JSX.Element => {
  return (
    <>
      <Head>
        <meta content="noindex" name="robots" />
      </Head>
      <QueueStatsView />
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageDescription: LOGAN_PAGE_META.QUEUE.pageDescription,
      pageTitle: LOGAN_PAGE_META.QUEUE.pageTitle,
      themeOptions: {
        palette: { background: { default: SMOKE.LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
