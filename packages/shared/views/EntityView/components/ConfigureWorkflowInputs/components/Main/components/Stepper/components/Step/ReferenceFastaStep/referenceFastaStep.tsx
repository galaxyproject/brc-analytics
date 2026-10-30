import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { RadioCheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioCheckedIcon/radioCheckedIcon";
import { RadioUncheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioUncheckedIcon/radioUncheckedIcon";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { useWorkflowEntity } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/hook";
import { Fragment, type JSX } from "react";
import { StyledStepContent } from "./referenceFastaStep.styles";
import { configureReference, getReferenceOptions } from "./utils";

/**
 * Reference assembly step component for organism-scoped workflows, choosing
 * the reference FASTA from the assemblies picked for the workflow's assembly
 * collection.
 * @param props - Component props.
 * @param props.active - Whether the step is active.
 * @param props.completed - Whether the step is completed.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.entryLabel - Step label.
 * @param props.index - Step index.
 * @param props.last - Whether this is the last step.
 * @param props.onConfigure - Callback to configure workflow input.
 * @param props.onContinue - Callback to continue to the next step.
 * @param props.onEdit - Callback to edit a completed step.
 * @param props.workflow - Workflow entity.
 * @returns Reference assembly step component.
 */
export const ReferenceFastaStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  last,
  onConfigure,
  onContinue,
  onEdit,
  workflow,
}: StepProps): JSX.Element => {
  const { assemblies = [] } = useWorkflowEntity() ?? {};
  const { fastaCollection, referenceAssembly } = configuredInput;
  const options = getReferenceOptions(assemblies, fastaCollection, workflow);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional>{referenceAssembly}</Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StyledStepContent>
        <RadioGroup
          onChange={(_, value) => onConfigure(configureReference(value))}
          value={referenceAssembly ?? ""}
        >
          {options.map((option) => (
            <FormControlLabel
              control={
                <Radio
                  checkedIcon={
                    <RadioCheckedIcon
                      fontSize={SVG_ICON_PROPS.FONT_SIZE.XSMALL}
                    />
                  }
                  icon={
                    <RadioUncheckedIcon
                      fontSize={SVG_ICON_PROPS.FONT_SIZE.XSMALL}
                    />
                  }
                  size="small"
                />
              }
              key={option.value}
              label={
                <Stack>
                  <span>{option.value}</span>
                  <Typography
                    color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                    variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
                  >
                    {option.description}
                  </Typography>
                </Stack>
              }
              value={option.value}
            />
          ))}
        </RadioGroup>
        {!last && (
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={!referenceAssembly}
            onClick={() => onContinue()}
          >
            Continue
          </Button>
        )}
      </StyledStepContent>
    </Step>
  );
};
