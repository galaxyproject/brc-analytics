import { Stack, Typography } from "@mui/material";
import { StyledButtonBase, StyledPaper } from "./dropzone.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Dot } from "@databiosphere/findable-ui/lib/components/common/Dot/dot";
import { FileUploadIcon } from "../../../../../../../../../../../../common/CustomIcon/components/FileUploadIcon/fileUploadIcon";
import { Props } from "./types";
import { STACK_PROPS } from "./constants";

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
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
          >
            <Stack direction="row" gap={1} useFlexGap>
              <span>Click to browse files</span>
              <Dot />
              <span>CSV, TSV supported</span>
            </Stack>
          </Typography>
        </Stack>
      </StyledButtonBase>
    </StyledPaper>
  );
};
