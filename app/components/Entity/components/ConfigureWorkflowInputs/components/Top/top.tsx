import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { JSX } from "react";
import { Props } from "./types";
import { getBreadcrumbs } from "./utils";

export const Top = ({ entityId, genome, workflow }: Props): JSX.Element => {
  return (
    <BackPageHero
      breadcrumbs={getBreadcrumbs({ entityId, genome, workflow })}
      title="Configure Inputs"
    />
  );
};
