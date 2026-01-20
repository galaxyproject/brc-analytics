import { ChangeEvent, useCallback, useRef, useState } from "react";
import { OnFileChangeOptions, UseFilePicker } from "./types";
import { hasFileChanged, parseFile } from "./utils";

export const useFilePicker = (): UseFilePicker => {
  const [errors, setErrors] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const isValid = file !== null && errors.length === 0;

  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onClear = useCallback((): void => {
    fileRef.current = null;
    setFile(null);
    setErrors([]);

    // Reset the input value to allow re-selecting the same file.
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const onClick = useCallback((): void => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (
      event: ChangeEvent<HTMLInputElement>,
      options: OnFileChangeOptions
    ): Promise<void> => {
      // Access the first file from the FileList.
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      // Check if the file has changed.
      const fileChanged = hasFileChanged(fileRef.current, selectedFile);

      // Update the file reference and state.
      fileRef.current = selectedFile;
      setFile(selectedFile);

      if (!fileChanged) return;

      try {
        const { errors, rows } = await parseFile(selectedFile);

        setErrors(errors);

        if (errors.length === 0) options.onComplete?.(rows);
      } catch (error) {
        console.error("Failed to parse file:", error);
      }
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
    validation: { errors, isValid },
  };
};
