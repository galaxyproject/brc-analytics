import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { StyledPagesMain } from "@/components/Layout/components/Main/main.styles";
import { config } from "@/config/config";
import { VisionView } from "@/views/VisionView/visionView";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { ROUTES } from "../../../routes/constants";
import type { PageProps } from "../../_app";

const Page = (): JSX.Element => {
  return <VisionView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  const { allowedPaths } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.ABOUT_VISION)) {
    return { notFound: true };
  }

  return {
    props: {
      ...BRC_PAGE_META.VISION,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
