import { ChangeEvent, RefObject } from "react";

export type OnFileChangeSuccess = () => void;

export interface UseFilePicker {
  actions: {
    onClear: () => void;
    onClick: () => void;
    onFileChange: (
      event: ChangeEvent<HTMLInputElement>,
      options: { onSuccess?: () => void }
    ) => void;
  };
  file: File | null;
  inputRef: RefObject<HTMLInputElement>;
}
