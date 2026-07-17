import { ROUTES } from "@brc-analytics/core/routes/constants";
import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { PartnerResourcesView as PartnerResourcesViewGA2 } from "@/views/PartnerResourcesView/ga2/partnerResourcesView";
import { PartnerResourcesView } from "@/views/PartnerResourcesView/partnerResourcesView";
import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { APP_KEYS } from "@site-config/common/constants";
import { GetStaticProps } from "next";
import { JSX } from "react";
import type { PageProps } from "../../_app";

const Page = (): JSX.Element => {
  const { appKey } = config();
  if (appKey === APP_KEYS.GA2) return <PartnerResourcesViewGA2 />;
  return <PartnerResourcesView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  const { allowedPaths, appKey } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.ABOUT_PARTNER_RESOURCES)) {
    return { notFound: true };
  }

  return {
    props: {
      ...getPageMeta(appKey).PARTNER_RESOURCES,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
