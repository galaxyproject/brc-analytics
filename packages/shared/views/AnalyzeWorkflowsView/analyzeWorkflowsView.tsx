import {
  BackPageContent,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { type AssemblyContract } from "@repo/shared/apis/types";
import { getEntity } from "@repo/shared/services/workflows/query";
import { type JSX } from "react";
import { Main } from "./components/Main/main";
import { Top } from "./components/Top/top";
import { type Props } from "./types";

/**
 * Displays the list of workflows compatible with an assembly, with the side
 * column supplied by the caller.
 * @param props - Component props.
 * @param props.SideComponent - Side column rendered for the assembly.
 * @param props.entityId - Assembly entity ID.
 * @returns A JSX element representing the compatible-workflows view.
 */
export const AnalyzeWorkflowsView = <
  T extends AssemblyContract = AssemblyContract,
>({
  entityId,
  SideComponent,
}: Props<T>): JSX.Element => {
  const assembly = getEntity<T>("assemblies", entityId);
  return (
    <BackPageView>
      <BackPageHero>
        <Top assembly={assembly} entityId={entityId} />
      </BackPageHero>
      <BackPageContent>
        <Main assembly={assembly} entityId={entityId} />
        <SideComponent assembly={assembly} />
      </BackPageContent>
    </BackPageView>
  );
};
