import {
  BackPageContent,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { getEntity } from "../../services/workflows/query";
import { Main } from "./components/Main/main";
import { Side } from "./components/Side/side";
import { Top } from "./components/Top/top";
import type { Organism, Props } from "./types";

/**
 * OrganismWorkflowsView component displays organism-scoped workflows for a given organism.
 * @param props - Component props.
 * @param props.entityId - Organism Entity ID.
 * @returns A JSX element representing the OrganismWorkflowsView.
 */
export const OrganismWorkflowsView = ({ entityId }: Props): JSX.Element => {
  const organism = getEntity<Organism>("organisms", entityId);
  return (
    <BackPageView>
      <BackPageHero>
        <Top entityId={entityId} organism={organism} />
      </BackPageHero>
      <BackPageContent>
        <Main entityId={entityId} organism={organism} />
        <Side organism={organism} />
      </BackPageContent>
    </BackPageView>
  );
};
