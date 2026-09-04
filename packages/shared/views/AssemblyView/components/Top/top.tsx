import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { FavoriteButton } from "@repo/shared/components/Favorites/components/FavoriteButton/favoriteButton";
import { ENTITY_TYPE } from "@repo/shared/providers/favorites/constants";
import { type JSX } from "react";
import { type Props } from "./types";
import { getBreadcrumbs } from "./utils";

/**
 * Top component for the assembly detail view, which displays the page title and breadcrumbs.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @returns A JSX element representing the top section of the assembly detail view.
 */
export const Top = ({ assembly }: Props): JSX.Element => {
  return (
    <BackPageHero
      actions={
        <FavoriteButton
          entityId={assembly.accession}
          entityType={ENTITY_TYPE.ASSEMBLY}
        />
      }
      breadcrumbs={getBreadcrumbs({ assembly })}
      title="Analyze in Galaxy"
    />
  );
};
