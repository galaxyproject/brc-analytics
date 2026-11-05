import { BRC_PAGE_META } from "@brc/meta/constants";
import { GenesView } from "@brc/views/GenesView/genesView";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { useGeneSearch } from "@repo/shared/hooks/useGeneSearch";
import { type GetStaticProps } from "next";
import Error from "next/error";
import { useRouter } from "next/router";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  const genePagesEnabled = useFeatureFlag(FEATURE_FLAGS.GENE_PAGES);
  const router = useRouter();
  const query =
    router.isReady && typeof router.query.q === "string"
      ? router.query.q.trim()
      : "";
  const search = useGeneSearch(genePagesEnabled ? query : undefined);
  if (!genePagesEnabled) return <Error statusCode={404} />;
  const onSearch = (q: string): void => {
    // Each search is a history entry, so Back returns to the one before.
    router.push(
      { pathname: router.pathname, query: q ? { q } : {} },
      undefined,
      { shallow: true }
    );
  };
  return <GenesView onSearch={onSearch} query={query} search={search} />;
};

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      ...BRC_PAGE_META.GENES,
    },
  };
};

export default Page;
