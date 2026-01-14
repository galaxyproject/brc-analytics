import { ChangeEvent, RefObject } from "react";

export interface OnFileChangeOptions {
  onSuccess?: (file: File) => Promise<void> | void;
}

export interface UseFilePicker {
  actions: {
    onClear: () => void;
    onClick: () => void;
    onFileChange: (
      event: ChangeEvent<HTMLInputElement>,
      options: OnFileChangeOptions
    ) => void;
  };
  file: File | null;
  inputRef: RefObject<HTMLInputElement>;
}
