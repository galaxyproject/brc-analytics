import {
  BackPageContent,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { getEntity } from "../../services/workflows/query";
import { Assembly } from "../WorkflowInputsView/types";
import { Main } from "./components/Main/main";
import { Side } from "./components/Side/side";
import { Top } from "./components/Top/top";
import { Props } from "./types";

/**
 * AnalyzeView component displays the option to select a workflow, or a custom workflow to configure.
 * @param props - Component props.
 * @param props.entityId - Assembly Entity ID.
 * @returns A JSX element representing the AnalyzeView.
 */
export const AnalyzeView = ({ entityId }: Props): JSX.Element => {
  const assembly = getEntity<Assembly>("assemblies", entityId);
  return (
    <BackPageView>
      <BackPageHero>
        <Top assembly={assembly} />
      </BackPageHero>
      <BackPageContent>
        <Main entityId={entityId} />
        <Side assembly={assembly} />
      </BackPageContent>
    </BackPageView>
  );
};
