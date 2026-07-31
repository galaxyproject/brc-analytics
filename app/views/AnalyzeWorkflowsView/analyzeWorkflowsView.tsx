import { Side } from "@/views/EntityView/assembly/components/Side/side";
import { type Assembly } from "@/views/WorkflowInputsView/types";
import {
  BackPageContent,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { getEntity } from "@repo/shared/services/workflows/query";
import { type JSX } from "react";
import { Main } from "./components/Main/main";
import { Top } from "./components/Top/top";
import { type Props } from "./types";

/**
 * AnalyzeWorkflowsView component displays the option to select a workflow from a list of compatible workflows.
 * @param props - Component props.
 * @param props.entityId - Assembly Entity ID.
 * @returns A JSX element representing the AnalyzeWorkflowsView.
 */
export const AnalyzeWorkflowsView = ({ entityId }: Props): JSX.Element => {
  const assembly = getEntity<Assembly>("assemblies", entityId);
  return (
    <BackPageView>
      <BackPageHero>
        <Top assembly={assembly} entityId={entityId} />
      </BackPageHero>
      <BackPageContent>
        <Main entityId={entityId} assembly={assembly} />
        <Side assembly={assembly} />
      </BackPageContent>
    </BackPageView>
  );
};
