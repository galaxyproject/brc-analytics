import { ChangeEvent, useCallback, useRef, useState } from "react";
import { UseFilePicker } from "./types";

export const useFilePicker = (): UseFilePicker => {
  const [file, setFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const onClear = useCallback((): void => {
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
    (event: ChangeEvent<HTMLInputElement>): void => {
      // Access the first file from the FileList.
      const selectedFile = event.target.files?.[0];

      if (selectedFile) setFile(selectedFile);
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
