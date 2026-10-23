import { FigureLightboxProvider } from "@databiosphere/findable-ui/lib/components/common/FigureLightbox/provider/provider";
import type { StaticProps } from "@repo/shared/views/docs/common/staticGeneration/types";
import { ContentView } from "@repo/shared/views/docs/ContentView/contentView";
import { type JSX } from "react";
import { getMDXComponents } from "./utils";

export const LearnContentView = (props: StaticProps): JSX.Element | null => {
  return (
    <FigureLightboxProvider>
      <ContentView {...props} components={getMDXComponents(props.slug)} />
    </FigureLightboxProvider>
  );
};
