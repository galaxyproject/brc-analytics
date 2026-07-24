import { StyledButtonBase } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/Dropzone/components/FileUploadButton/fileUploadButton.styles";
import {
  TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS,
  STACK_PROPS,
} from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/Dropzone/constants";
import { Dropzone as DropzoneBase } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/Dropzone/dropzone";
import { Dot } from "@databiosphere/findable-ui/lib/components/common/Dot/dot";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack, Typography } from "@mui/material";
import { FileUploadIcon } from "@repo/shared/components/CustomIcon/components/FileUploadIcon/fileUploadIcon";
import { JSX } from "react";
import { Props } from "./types";

export const Dropzone = ({ onClick, onDrop }: Props): JSX.Element => {
  return (
    <DropzoneBase onDrop={onDrop}>
      <StyledButtonBase aria-label="Upload a sample sheet" onClick={onClick}>
        <FileUploadIcon />
        <Stack {...STACK_PROPS}>
          <Typography
            component="div"
            variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
          >
            Upload a Sample Sheet
          </Typography>
          <Stack direction="row" gap={1} useFlexGap>
            <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
              Click or drop files here
            </Typography>
            <Dot />
            <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
              CSV, TSV supported
            </Typography>
          </Stack>
        </Stack>
      </StyledButtonBase>
    </DropzoneBase>
  );
};
