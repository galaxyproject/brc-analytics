import { ChangeEvent, RefObject } from "react";

export interface OnFileChangeOptions {
  onComplete?: (rows: Record<string, string>[]) => void;
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
  validation: Validation;
}

export interface Validation {
  errors: string[];
  valid: boolean;
}
