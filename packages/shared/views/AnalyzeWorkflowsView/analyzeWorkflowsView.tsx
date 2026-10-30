import {
  BackPageContent,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { type AssemblyContract } from "@repo/shared/apis/types";
import { type JSX } from "react";
import { Main } from "./components/Main/main";
import { Top } from "./components/Top/top";
import { type Props } from "./types";

/**
 * Displays the list of workflows compatible with an assembly, with the side
 * column supplied by the caller.
 * @param props - Component props.
 * @param props.SideComponent - Side column rendered for the assembly.
 * @param props.assembly - Assembly.
 * @param props.entityId - Assembly entity ID.
 * @returns A JSX element representing the compatible-workflows view.
 */
export const AnalyzeWorkflowsView = <
  T extends AssemblyContract = AssemblyContract,
>({
  assembly,
  entityId,
  SideComponent,
}: Props<T>): JSX.Element => {
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
