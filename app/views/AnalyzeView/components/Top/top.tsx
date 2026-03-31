import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { JSX } from "react";
import { Props } from "./types";
import { getBreadcrumbs } from "./utils";

/**
 * Top component for the AnalyzeView, which displays the page title and breadcrumbs.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @returns A JSX element representing the top section of the AnalyzeView.
 */
export const Top = ({ assembly }: Props): JSX.Element => {
  return (
    <BackPageHero
      breadcrumbs={getBreadcrumbs({ assembly })}
      title="Analyze in Galaxy"
    />
  );
};
