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
 * Assembly detail view: renders the assembly header and analysis options, with
 * the side column supplied by the caller.
 * @param props - Component props.
 * @param props.SideComponent - Side column rendered for the assembly.
 * @param props.entityId - Assembly entity ID.
 * @returns A JSX element representing the assembly detail view.
 */
export const AssemblyView = <T extends AssemblyContract = AssemblyContract>({
  entityId,
  SideComponent,
}: Props<T>): JSX.Element => {
  const assembly = getEntity<T>("assemblies", entityId);
  return (
    <BackPageView>
      <BackPageHero>
        <Top assembly={assembly} />
      </BackPageHero>
      <BackPageContent>
        <Main entityId={entityId} />
        <SideComponent assembly={assembly} />
      </BackPageContent>
    </BackPageView>
  );
};
