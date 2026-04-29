import { Loading } from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { PAPER_PANEL_STYLE } from "@databiosphere/findable-ui/lib/components/common/Paper/paper";
import { JSX, useState } from "react";
import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { useLaunchGalaxy } from "./components/Stepper/components/Step/hooks/UseLaunchGalaxy/useLaunchGalaxy";
import { Stepper } from "./components/Stepper/stepper";
import { StyledButton, StyledMainContainer } from "./main.styles";
import { Props } from "./types";

export const Main = ({
  activeStep,
  configuredInput,
  configuredSteps,
  genome,
  onConfigure,
  onContinue,
  onEdit,
  workflow: initWorkflow,
}: Props): JSX.Element => {
  /**
   * Keep `workflow` in state to preserve a stable object reference across renders.
   */
  const [workflow] = useState<Workflow>(initWorkflow);
  const { onLaunchGalaxy, status } = useLaunchGalaxy({
    configuredInput,
    workflow,
  });
  return (
    <StyledMainContainer>
      <Loading loading={status.loading} panelStyle={PAPER_PANEL_STYLE.FLUID} />
      <Stepper
        activeStep={activeStep}
        configuredInput={configuredInput}
        configuredSteps={configuredSteps}
        genome={genome}
        onConfigure={onConfigure}
        onContinue={onContinue}
        onEdit={onEdit}
        onLaunchGalaxy={onLaunchGalaxy}
        status={status}
        workflow={workflow}
      />
      <StyledButton
        {...BUTTON_PROPS.PRIMARY_CONTAINED}
        data-testid="launch-galaxy-button"
        disabled={status.disabled || status.loading}
        onClick={onLaunchGalaxy}
      >
        Launch In Galaxy
      </StyledButton>
    </StyledMainContainer>
  );
};
