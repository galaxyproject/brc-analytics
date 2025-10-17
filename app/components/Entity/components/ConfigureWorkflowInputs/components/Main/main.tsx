import { Props } from "./types";
import { Stepper } from "./components/Stepper/stepper";
import { Loading } from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { PAPER_PANEL_STYLE } from "@databiosphere/findable-ui/lib/components/common/Paper/paper";
import { useLaunchGalaxy } from "./components/Stepper/components/Step/hooks/UseLaunchGalaxy/useLaunchGalaxy";
import { StyledMainContainer } from "./main.styles";
import { Button } from "@mui/material";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";

export const Main = ({
  configuredInput,
  configuredSteps,
  genome,
  onConfigure,
  workflow,
}: Props): JSX.Element => {
  const { onLaunchGalaxy, status } = useLaunchGalaxy({
    configuredInput,
    workflow,
  });
  return (
    <StyledMainContainer>
      <Loading loading={status.loading} panelStyle={PAPER_PANEL_STYLE.FLUID} />
      <Stepper
        configuredSteps={configuredSteps}
        genome={genome}
        onConfigure={onConfigure}
        onLaunchGalaxy={onLaunchGalaxy}
        status={status}
        workflow={workflow}
      />
      <Button
        {...BUTTON_PROPS.PRIMARY_CONTAINED}
        disabled={status.disabled || status.loading}
        onClick={onLaunchGalaxy}
        style={{ marginTop: 16 }}
      >
        Launch In Galaxy
      </Button>
    </StyledMainContainer>
  );
};
