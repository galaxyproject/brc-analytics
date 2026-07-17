import { DragEvent, useCallback, useState } from "react";
import { UseDropzone } from "./types";

/**
 * Manages native HTML drag-and-drop state and event handlers for a dropzone element.
 * Uses relatedTarget containment checks to prevent the active state from flickering
 * when dragging over child elements.
 * @param onFileDrop - Callback invoked with the drop event when a file is dropped.
 * @returns Drag event actions to spread onto a container element and drag-active state.
 */
export const useDropzone = (
  onFileDrop: (event: DragEvent<HTMLElement>) => void
): UseDropzone => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Only deactivate when leaving the dropzone entirely, not when entering a child.
    const { currentTarget, relatedTarget } = event;
    if (!currentTarget.contains(relatedTarget as Node)) {
      setIsDragActive(false);
    }
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
      onFileDrop(event);
    },
    [onFileDrop]
  );

  return {
    actions: {
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
    },
    state: {
      isDragActive,
    },
  };
};
