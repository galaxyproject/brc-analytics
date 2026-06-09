import { GetStaticProps } from "next";
import { JSX } from "react";
import { BRC_PAGE_META } from "../../../app/common/meta/brc/constants";
import { StyledPagesMain } from "../../../app/components/Layout/components/Main/main.styles";
import { VisionView } from "../../../app/views/VisionView/visionView";
import type { PageProps } from "../../_app";

const Page = (): JSX.Element => {
  return <VisionView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
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
