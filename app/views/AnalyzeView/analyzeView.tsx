import { getEntity } from "@brc-analytics/core/services/workflows/query";
import { Main } from "@brc-analytics/core/views/AnalyzeView/components/Main/main";
import { Props } from "@brc-analytics/core/views/AnalyzeView/types";
import {
  BackPageContent,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { Side } from "../EntityView/assembly/components/Side/side";
import { Assembly } from "../WorkflowInputsView/types";
import { Top } from "./components/Top/top";

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
