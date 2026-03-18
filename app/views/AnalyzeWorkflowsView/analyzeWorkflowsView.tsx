import {
  BackPageContent,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { getEntity } from "../../services/workflows/query";
import { Side } from "../EntityView/assembly/components/Side/side";
import { Assembly } from "../WorkflowInputsView/types";
import { Main } from "./components/Main/main";
import { Top } from "./components/Top/top";
import { Props } from "./types";

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
