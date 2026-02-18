import React, { JSX, useMemo } from "react";
import { Props } from "./types";
import { getAssembly, getWorkflow } from "../../services/workflows/entities";
import {
  BackPageContentSideColumn,
  BackPageContent,
  BackPageView,
  BackPageHero,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { StyledBackPageContentMainColumn } from "./workflowView.styles";
import { Top } from "./components/Top/top";
import { SideColumn } from "./components/SideColumn/sideColumn";
import { useConfigureInputs } from "../WorkflowInputsView/hooks/UseConfigureInputs/useConfigureInputs";
import { useConfiguredSteps } from "./steps/hook";
import { useStepper } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/hook";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { Assembly } from "../WorkflowInputsView/types";

/**
 * WorkflowView renders the main view for configuring a workflow.
 * @param props - Props.
 * @param props.trsId - Workflow TRS ID.
 * @returns Workflow view.
 */
export const WorkflowView = ({ trsId }: Props): JSX.Element => {
  const workflow = getWorkflow(trsId);

  const { configuredInput, onConfigure } = useConfigureInputs();
  const { referenceAssembly: assemblyId = "" } = configuredInput;
  const { configuredSteps } = useConfiguredSteps(workflow);
  const { activeStep, onContinue, onEdit } = useStepper(configuredSteps);
  const { hasSidePanel } = configuredSteps[activeStep] || {};

  const genome = useMemo(
    () => (assemblyId ? getAssembly<Assembly>(assemblyId) : undefined),
    [assemblyId]
  );

  return (
    <BackPageView>
      <BackPageHero>
        <Top workflow={workflow} />
      </BackPageHero>
      <BackPageContent>
        <StyledBackPageContentMainColumn hasSidePanel={hasSidePanel}>
          <Main
            activeStep={activeStep}
            configuredInput={configuredInput}
            configuredSteps={configuredSteps}
            genome={genome}
            onConfigure={onConfigure}
            onContinue={onContinue}
            onEdit={onEdit}
            workflow={workflow}
          />
        </StyledBackPageContentMainColumn>
        {!hasSidePanel && (
          <BackPageContentSideColumn>
            <SideColumn workflow={workflow} />
          </BackPageContentSideColumn>
        )}
      </BackPageContent>
    </BackPageView>
  );
};
