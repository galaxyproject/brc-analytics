import { EntityDataGate } from "@/components/EntityDataGate/entityDataGate";
import { StyledExploreView } from "@/views/ExploreView/exploreView.styles";
import { JSX } from "react";
import type { Props } from "./types";
import { getEntitiesResponse } from "./utils";

/**
 * Renders the explore table for an entity list type, sourcing its rows from the
 * client-loaded entity store rather than inlined static props. Gated on the
 * store being loaded so the table mounts with populated data.
 * @param props - Props.
 * @param props.entityListType - Entity list type.
 * @returns explore view, gated on the entity store being loaded.
 */
export const EntitiesView = ({
  entityListType,
  ...props
}: Props): JSX.Element => {
  return (
    <EntityDataGate>
      <StyledExploreView
        entityListType={entityListType}
        data={getEntitiesResponse(entityListType)}
        {...props}
      />
    </EntityDataGate>
  );
};
