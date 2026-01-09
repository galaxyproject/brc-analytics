import { ChangeEvent, RefObject } from "react";

export interface UseFilePicker {
  actions: {
    onClear: () => void;
    onClick: () => void;
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  };
  file: File | null;
  inputRef: RefObject<HTMLInputElement>;
}
