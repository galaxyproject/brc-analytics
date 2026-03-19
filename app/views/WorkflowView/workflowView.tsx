import {
  BackPageContent,
  BackPageContentSideColumn,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX, useMemo } from "react";
import { sanitizeEntityId } from "../../apis/catalog/common/utils";
import { useStepper } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/hook";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { getAssembly, getWorkflow } from "../../services/workflows/entities";
import { useConfigureInputs } from "../WorkflowInputsView/hooks/UseConfigureInputs/useConfigureInputs";
import { Assembly } from "../WorkflowInputsView/types";
import { Top } from "./components/Top/top";
import { useConfiguredSteps } from "./steps/hook";
import { Props } from "./types";
import { StyledBackPageContentMainColumn } from "./workflowView.styles";

/**
 * WorkflowView renders the main view for configuring a workflow.
 * @param props - Props.
 * @param props.trsId - Workflow TRS ID.
 * @returns Workflow view.
 */
export const WorkflowView = ({ trsId }: Props): JSX.Element => {
  const workflow = getWorkflow(trsId);

  const { configuredInput, onConfigure } = useConfigureInputs();
  const { referenceAssembly } = configuredInput;
  const { configuredSteps } = useConfiguredSteps(workflow);
  const { activeStep, onContinue, onEdit } = useStepper(configuredSteps);
  const { hasSidePanel } = configuredSteps[activeStep] || {};

  const assemblyId = sanitizeEntityId(referenceAssembly);

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
            <SideColumn
              configuredInput={configuredInput}
              configuredSteps={configuredSteps}
              genome={genome}
              workflow={workflow}
            />
          </BackPageContentSideColumn>
        )}
      </BackPageContent>
    </BackPageView>
  );
};
