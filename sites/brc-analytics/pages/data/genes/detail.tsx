import { BRC_PAGE_META } from "@brc/meta/constants";
import { GeneDetailView } from "@brc/views/GeneDetailView/geneDetailView";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { findGeneByUid } from "@repo/shared/services/genes/fixture";
import { type GetStaticProps } from "next";
import Error from "next/error";
import { useRouter } from "next/router";
import { type JSX } from "react";

interface GeneDetailProps {
  pageDescription: string;
  pageTitle: string;
}

const Page = (): JSX.Element => {
  const genePagesEnabled = useFeatureFlag(FEATURE_FLAGS.GENE_PAGES);
  const { isReady, query } = useRouter();
  if (!isReady) return <></>;
  if (!genePagesEnabled) return <Error statusCode={404} />;
  const geneUid = query.uid;
  if (typeof geneUid !== "string") return <Error statusCode={404} />;
  const gene = findGeneByUid(geneUid);
  if (!gene) return <Error statusCode={404} />;
  const title = gene.symbol ? `${gene.geneId} (${gene.symbol})` : gene.geneId;
  return <GeneDetailView gene={gene} title={title} />;
};

export const getStaticProps: GetStaticProps<GeneDetailProps> = () => {
  return {
    props: {
      ...BRC_PAGE_META.GENE_DETAIL,
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
