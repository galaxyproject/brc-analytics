import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Button, Stack, Typography } from "@mui/material";
import { ScientificName } from "@repo/shared/components/ScientificName/scientificName";
import { StyledPaper } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/SelectorDataSelector/selectorDataSelector.styles";
import {
  formatAssemblyCount,
  hasEnoughAssemblies,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/utils";
import { useWorkflowEntity } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/hook";
import { type JSX } from "react";
import { type Props } from "./types";
import { renderAssemblyRequirement } from "./utils";

/**
 * Data selector component prompting the user to browse and select assemblies,
 * or explaining that the organism has too few assemblies for the workflow.
 * @param props - Component props.
 * @param props.assemblyCount - Number of assemblies the organism has.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.onOpen - Callback to open the assemblies selector dialog.
 * @param props.workflow - Workflow entity.
 * @returns Data selector component or null if assemblies are already selected.
 */
export const DataSelector = ({
  assemblyCount,
  configuredInput,
  onOpen,
  workflow,
}: Props): JSX.Element | null => {
  const taxonomicLevelSpecies = useWorkflowEntity()?.taxonomicLevelSpecies;
  if (configuredInput.fastaCollection?.length) return null;
  const isEnough = hasEnoughAssemblies(assemblyCount, workflow);
  return (
    <StyledPaper elevation={0}>
      <Stack spacing={1}>
        <Typography
          component="div"
          variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
        >
          {isEnough ? "No Assemblies Selected" : "Not Enough Assemblies"}
        </Typography>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          {isEnough ? (
            renderAssemblyRequirement(workflow)
          ) : (
            <>
              This workflow needs at least{" "}
              {formatAssemblyCount(workflow.assemblyCountMin)}, and{" "}
              <ScientificName>{taxonomicLevelSpecies}</ScientificName> has{" "}
              {assemblyCount}.
            </>
          )}
        </Typography>
      </Stack>
      {isEnough && (
        <Button {...BUTTON_PROPS.PRIMARY_CONTAINED} onClick={onOpen}>
          Browse
        </Button>
      )}
    </StyledPaper>
  );
};
