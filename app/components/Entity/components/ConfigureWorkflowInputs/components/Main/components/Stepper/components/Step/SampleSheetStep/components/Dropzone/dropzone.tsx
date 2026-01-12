import { Stack, Typography } from "@mui/material";
import { StyledButtonBase, StyledPaper } from "./dropzone.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Dot } from "@databiosphere/findable-ui/lib/components/common/Dot/dot";
import { FileUploadIcon } from "../../../../../../../../../../../../common/CustomIcon/components/FileUploadIcon/fileUploadIcon";
import { Props } from "./types";
import {
  STACK_PROPS,
  TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS,
} from "./constants";

export const Dropzone = ({ onClick }: Props): JSX.Element => {
  return (
    <StyledPaper elevation={0}>
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
              Click to browse files
            </Typography>
            <Dot />
            <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
              CSV, TSV supported
            </Typography>
          </Stack>
        </Stack>
      </StyledButtonBase>
    </StyledPaper>
  );
};
