import { BRC_PAGE_META } from "@brc/meta/constants";
import { GenesView } from "@brc/views/GenesView/genesView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const GENE_PAGES_ENABLED =
  process.env.NEXT_PUBLIC_GENE_PAGES_ENABLED === "true";

const Page = (): JSX.Element => {
  return <GenesView />;
};

export const getStaticProps: GetStaticProps = () => {
  if (!GENE_PAGES_ENABLED) return { notFound: true };
  return {
    props: {
      ...BRC_PAGE_META.GENES,
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
