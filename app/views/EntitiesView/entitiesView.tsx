import { StyledExploreView } from "@/views/ExploreView/exploreView.styles";
import { JSX } from "react";
import type { Props } from "./types";
import { getEntitiesResponse } from "./utils";

/**
 * Renders the explore table for an entity list type, sourcing its rows from the
 * client-loaded entity store rather than inlined static props. Expects the store
 * to be loaded — the page gates rendering on it — so the response is built only
 * at runtime, never during static prerender.
 * @param props - Props.
 * @param props.entityListType - Entity list type.
 * @returns explore view.
 */
export const EntitiesView = ({
  entityListType,
  ...props
}: Props): JSX.Element => {
  return (
    <StyledExploreView
      entityListType={entityListType}
      data={getEntitiesResponse(entityListType)}
      {...props}
    />
  );
};
