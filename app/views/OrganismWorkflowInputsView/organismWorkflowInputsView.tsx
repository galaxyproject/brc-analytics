import {
  BackPageContent,
  BackPageContentMainColumn,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { getWorkflow } from "../../services/workflows/entities";
import { getEntity } from "../../services/workflows/query";
import type { Organism } from "../OrganismWorkflowsView/types";
import { Top } from "./components/Top/top";
import type { Props } from "./types";

/**
 * OrganismWorkflowInputsView is a placeholder for the organism workflow configure inputs page.
 * @param props - Component props.
 * @param props.entityId - Organism Entity ID.
 * @param props.trsId - Workflow TRS ID.
 * @returns A JSX element representing the OrganismWorkflowInputsView.
 */
export const OrganismWorkflowInputsView = ({
  entityId,
  trsId,
}: Props): JSX.Element => {
  const organism = getEntity<Organism>("organisms", entityId);
  const workflow = getWorkflow(trsId);
  return (
    <BackPageView>
      <BackPageHero>
        <Top entityId={entityId} organism={organism} workflow={workflow} />
      </BackPageHero>
      <BackPageContent>
        <BackPageContentMainColumn />
      </BackPageContent>
    </BackPageView>
  );
};
