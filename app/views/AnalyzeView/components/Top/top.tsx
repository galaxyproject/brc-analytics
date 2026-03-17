import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { JSX } from "react";
import { Props } from "./types";
import { getBreadcrumbs } from "./utils";

export const Top = ({ assembly }: Props): JSX.Element => {
  return (
    <BackPageHero
      breadcrumbs={getBreadcrumbs(assembly)}
      title="Analyze in Galaxy"
    />
  );
};
