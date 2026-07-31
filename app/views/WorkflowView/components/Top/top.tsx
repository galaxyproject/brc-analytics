import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { type JSX } from "react";
import { type Props } from "./types";
import { getBreadcrumbs } from "./utils";

export const Top = ({ workflow }: Props): JSX.Element => {
  return (
    <BackPageHero
      breadcrumbs={getBreadcrumbs({ workflow })}
      title="Configure Inputs"
    />
  );
};
