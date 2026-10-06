import { BRC_PAGE_META } from "@brc/meta/constants";
import { GenesView } from "@brc/views/GenesView/genesView";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { type GetStaticProps } from "next";
import Error from "next/error";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  const genePagesEnabled = useFeatureFlag(FEATURE_FLAGS.GENE_PAGES);
  if (!genePagesEnabled) return <Error statusCode={404} />;
  return <GenesView />;
};

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      ...BRC_PAGE_META.GENES,
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
