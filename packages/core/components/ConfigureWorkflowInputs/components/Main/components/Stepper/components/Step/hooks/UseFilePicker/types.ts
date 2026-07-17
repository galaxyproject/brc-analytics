import { ChangeEvent, DragEvent, RefObject } from "react";

export interface OnFileChangeOptions<T> {
  onComplete?: (data: T, file: File) => void;
}

export type ParseFn<T> = (file: File) => Promise<ParseResult<T>>;

export interface ParseResult<T> {
  data: T;
  errors: string[];
}

export interface UseFilePicker<T> {
  actions: {
    onClear: () => void;
    onClick: () => void;
    onDrop: (
      event: DragEvent<HTMLElement>,
      options: OnFileChangeOptions<T>
    ) => void;
    onFileChange: (
      event: ChangeEvent<HTMLInputElement>,
      options: OnFileChangeOptions<T>
    ) => void;
  };
  file: File | null;
  inputRef: RefObject<HTMLInputElement | null>;
  validation: Validation;
}

export interface Validation {
  errors: string[];
  valid: boolean;
}
