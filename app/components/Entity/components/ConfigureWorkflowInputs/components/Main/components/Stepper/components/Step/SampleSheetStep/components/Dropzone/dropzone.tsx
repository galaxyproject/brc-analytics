import { Stack, Typography } from "@mui/material";
import { DragEvent, useCallback, useState } from "react";
import { StyledButtonBase, StyledPaper } from "./dropzone.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Dot } from "@databiosphere/findable-ui/lib/components/common/Dot/dot";
import { FileUploadIcon } from "../../../../../../../../../../../../common/CustomIcon/components/FileUploadIcon/fileUploadIcon";
import { Props } from "./types";
import {
  STACK_PROPS,
  TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS,
} from "./constants";

export const Dropzone = ({ onClick, onDrop }: Props): JSX.Element => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
      onDrop(event);
    },
    [onDrop]
  );

  return (
    <StyledPaper
      elevation={0}
      isDragActive={isDragActive}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
    </StyledPaper>
  );
};
