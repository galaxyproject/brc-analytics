import { BRC_PAGE_META } from "@brc/meta/constants";
import {
  GeneDetailView,
  GeneStatusView,
} from "@brc/views/GeneDetailView/geneDetailView";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { useGene } from "@repo/shared/hooks/useGene";
import { geneLabel, geneSymbol } from "@repo/shared/services/genes/label";
import { type GetStaticProps } from "next";
import Error from "next/error";
import Head from "next/head";
import { useRouter } from "next/router";
import { type JSX } from "react";

interface GeneDetailProps {
  pageDescription: string;
  pageTitle: string;
}

const Page = (): JSX.Element => {
  const genePagesEnabled = useFeatureFlag(FEATURE_FLAGS.GENE_PAGES);
  const { isReady, query } = useRouter();
  const geneUid = typeof query.uid === "string" ? query.uid : undefined;
  const result = useGene(isReady && genePagesEnabled ? geneUid : undefined);
  if (!isReady) return <></>;
  if (!genePagesEnabled || !geneUid) return <Error statusCode={404} />;
  if (result.status === "not_found") return <Error statusCode={404} />;
  if (result.status === "loading")
    return <GeneStatusView message="Loading gene…" />;
  if (result.status === "unavailable")
    return (
      <GeneStatusView message="Gene data is unavailable right now. Please try again later." />
    );
  const { gene } = result;
  const symbol = geneSymbol(gene);
  const title = symbol ? `${geneLabel(gene)} (${symbol})` : geneLabel(gene);
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <GeneDetailView gene={gene} title={title} />
    </>
  );
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
