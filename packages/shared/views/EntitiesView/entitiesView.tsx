import { StyledExploreView } from "@repo/shared/views/ExploreView/exploreView.styles";
import { type JSX } from "react";
import { useEntitiesData } from "./hooks/UseEntitiesData/hook";
import type { Props } from "./types";

/**
 * Renders the explore table for an entity list type, sourcing its rows from the
 * client-loaded entity store rather than inlined static props. Expects the store
 * to be loaded — the page gates rendering on it — so the entities are read at
 * runtime only, never during static prerender.
 * @param props - Props.
 * @param props.entityListType - Entity list type.
 * @returns explore view.
 */
export const EntitiesView = ({
  entityListType,
  ...props
}: Props): JSX.Element => {
  const data = useEntitiesData(entityListType);
  return (
    <StyledExploreView entityListType={entityListType} data={data} {...props} />
  );
};
