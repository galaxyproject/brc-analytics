import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { PartnerResourcesView } from "@brc/views/PartnerResourcesView/partnerResourcesView";
import { PartnerResourcesView as PartnerResourcesViewGA2 } from "@ga2/views/PartnerResourcesView/partnerResourcesView";
import type { PageProps } from "@pages/_app";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { ROUTES } from "@routes/constants";
import { APP_KEYS } from "@site-config/common/constants";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

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
