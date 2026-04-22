import { Dot } from "@databiosphere/findable-ui/lib/components/common/Dot/dot";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack, Typography } from "@mui/material";
import { JSX } from "react";
import { FileUploadIcon } from "../../../../../../../../../../../../common/CustomIcon/components/FileUploadIcon/fileUploadIcon";
import { StyledButtonBase } from "../../../components/Dropzone/components/FileUploadButton/fileUploadButton.styles";
import {
  TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS,
  STACK_PROPS,
} from "../../../components/Dropzone/constants";
import { Dropzone as DropzoneBase } from "../../../components/Dropzone/dropzone";
import { Props } from "./types";

/**
 * FASTA file dropzone with click-to-upload support.
 * @param props - Component props.
 * @param props.onClick - Opens the native file picker dialog.
 * @param props.onDrop - Callback invoked with the drop event when a file is dropped.
 * @returns Dropzone element.
 */
export const Dropzone = ({ onClick, onDrop }: Props): JSX.Element => {
  return (
    <DropzoneBase onDrop={onDrop}>
      <StyledButtonBase aria-label="Upload a FASTA file" onClick={onClick}>
        <FileUploadIcon />
        <Stack {...STACK_PROPS}>
          <Typography
            component="div"
            variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
          >
            Upload a FASTA File
          </Typography>
          <Stack direction="row" gap={1} useFlexGap>
            <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
              Click or drop files here
            </Typography>
            <Dot />
            <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
              FASTA supported
            </Typography>
          </Stack>
        </Stack>
      </StyledButtonBase>
    </DropzoneBase>
  );
};
