import { ChangeEvent, useCallback, useRef, useState } from "react";
import { UseFilePicker } from "./types";
import { hasFileChanged } from "./utils";

export const useFilePicker = (): UseFilePicker => {
  const [file, setFile] = useState<File | null>(null);

  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onClear = useCallback((): void => {
    fileRef.current = null;
    setFile(null);
    // Reset the input value to allow re-selecting the same file.
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const onClick = useCallback((): void => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (
      event: ChangeEvent<HTMLInputElement>,
      options: { onSuccess?: () => void }
    ): void => {
      // Access the first file from the FileList.
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      // Check if the file has changed.
      if (hasFileChanged(fileRef.current, selectedFile)) {
        options.onSuccess?.();
      }

      // Update the file reference.
      fileRef.current = selectedFile;

      // Update the file state.
      setFile(selectedFile);
    },
    []
  );

  return {
    actions: {
      onClear,
      onClick,
      onFileChange,
    },
    file,
    inputRef,
  };
};
