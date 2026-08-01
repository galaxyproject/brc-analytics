import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { config } from "@/config/config";
import { VisionView } from "@brc/views/VisionView/visionView";
import type { PageProps } from "@pages/_app";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { ROUTES } from "@routes/constants";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

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
