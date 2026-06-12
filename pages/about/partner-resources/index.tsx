import { GetStaticProps } from "next";
import { JSX } from "react";
import { getPageMeta } from "../../../app/common/meta/utils";
import { StyledPagesMain } from "../../../app/components/Layout/components/Main/main.styles";
import { config } from "../../../app/config/config";
import { PartnerResourcesView } from "../../../app/views/PartnerResourcesView/partnerResourcesView";
import { PartnerResourcesViewGA2 } from "../../../app/views/PartnerResourcesView/partnerResourcesViewGA2";
import { ROUTES } from "../../../routes/constants";
import { APP_KEYS } from "../../../site-config/common/constants";
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
