import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { BRC_PAGE_META } from "~/meta/constants";
import { PartnerResourcesView } from "~/views/PartnerResourcesView/partnerResourcesView";
import type { PageProps } from "../../_app";

const Page = (): JSX.Element => {
  return <PartnerResourcesView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.PARTNER_RESOURCES,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
