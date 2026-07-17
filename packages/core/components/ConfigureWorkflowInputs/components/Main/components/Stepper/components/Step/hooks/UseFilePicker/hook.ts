import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { FALLBACK_ERROR } from "./constants";
import { OnFileChangeOptions, ParseFn, UseFilePicker } from "./types";
import { hasFileChanged, isValid } from "./utils";

/**
 * Generic file picker hook that manages file selection state, validation, and parsing.
 * @param parseFn - Function that parses the selected file and returns data with validation errors.
 * @returns File picker actions, file state, input ref, and validation state.
 */
export const useFilePicker = <T>(parseFn: ParseFn<T>): UseFilePicker<T> => {
  const [errors, setErrors] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const valid = useMemo(() => isValid(file, errors), [file, errors]);

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

  const onDrop = useCallback(
    async (
      event: DragEvent<HTMLElement>,
      options: OnFileChangeOptions<T>
    ): Promise<void> => {
      event.preventDefault();

      const droppedFile = event.dataTransfer.files?.[0];
      if (!droppedFile) return;

      const fileChanged = hasFileChanged(fileRef.current, droppedFile);

      fileRef.current = droppedFile;
      setFile(droppedFile);

      // Reset the input value to allow re-selecting the same file.
      if (inputRef.current) inputRef.current.value = "";

      if (!fileChanged) return;

      try {
        const { data, errors } = await parseFn(droppedFile);

        setErrors(errors);

        if (errors.length === 0) options.onComplete?.(data, droppedFile);
      } catch {
        setErrors([FALLBACK_ERROR]);
      }
    },
    [parseFn]
  );

  const onFileChange = useCallback(
    async (
      event: ChangeEvent<HTMLInputElement>,
      options: OnFileChangeOptions<T>
    ): Promise<void> => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      const fileChanged = hasFileChanged(fileRef.current, selectedFile);

      fileRef.current = selectedFile;
      setFile(selectedFile);

      if (!fileChanged) return;

      try {
        const { data, errors } = await parseFn(selectedFile);

        setErrors(errors);

        if (errors.length === 0) options.onComplete?.(data, selectedFile);
      } catch {
        setErrors([FALLBACK_ERROR]);
      }
    },
    [parseFn]
  );

  return {
    actions: {
      onClear,
      onClick,
      onDrop,
      onFileChange,
    },
    file,
    inputRef,
    validation: { errors, valid },
  };
};
