import { JSX } from "react";
import { StyledPaper } from "./dropzone.styles";
import { useDropzone } from "./hooks/useDropzone";
import { Props } from "./types";

/**
 * Shared dropzone container that provides drag-and-drop file handling with visual feedback.
 * @param props - Component props.
 * @param props.children - Content to render inside the dropzone.
 * @param props.onDrop - Callback invoked with the drop event when a file is dropped.
 * @returns Dropzone element.
 */
export const Dropzone = ({ children, onDrop }: Props): JSX.Element => {
  const { actions, state } = useDropzone(onDrop);
  return (
    <StyledPaper elevation={0} isDragActive={state.isDragActive} {...actions}>
      {children}
    </StyledPaper>
  );
};
