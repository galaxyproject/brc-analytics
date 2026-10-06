import { BRC_PAGE_META } from "@brc/meta/constants";
import { GeneDetailView } from "@brc/views/GeneDetailView/geneDetailView";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import {
  findGeneByUid,
  GENE_FIXTURE,
} from "@repo/shared/services/genes/fixture";
import { type GeneRecord } from "@repo/shared/services/genes/types";
import {
  type GetStaticPaths,
  type GetStaticProps,
  type InferGetStaticPropsType,
} from "next";
import Error from "next/error";
import { type JSX } from "react";

interface GeneDetailProps {
  gene: GeneRecord;
  pageDescription: string;
  pageTitle: string;
}

const Page = ({
  gene,
  pageTitle,
}: InferGetStaticPropsType<typeof getStaticProps>): JSX.Element => {
  const genePagesEnabled = useFeatureFlag(FEATURE_FLAGS.GENE_PAGES);
  if (!genePagesEnabled) return <Error statusCode={404} />;
  return <GeneDetailView gene={gene} title={pageTitle} />;
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    fallback: false,
    paths: GENE_FIXTURE.map((gene) => ({
      params: { geneUid: gene.geneUid },
    })),
  };
};

export const getStaticProps: GetStaticProps<GeneDetailProps> = (context) => {
  const geneUid = context.params?.geneUid;
  if (typeof geneUid !== "string") return { notFound: true };
  const gene = findGeneByUid(geneUid);
  if (!gene) return { notFound: true };
  const title = gene.symbol ? `${gene.geneId} (${gene.symbol})` : gene.geneId;
  return {
    props: {
      ...BRC_PAGE_META.GENE_DETAIL,
      gene,
      pageTitle: title,
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
