import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { VALIDATION_ERROR } from "./constants";
import { OnFileChangeOptions, UseFilePicker } from "./types";
import { hasFileChanged, isValid, parseFile } from "./utils";

export const useFilePicker = (): UseFilePicker => {
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
      options: OnFileChangeOptions
    ): Promise<void> => {
      event.preventDefault();

      // Access the first file from the DataTransfer.
      const droppedFile = event.dataTransfer.files?.[0];
      if (!droppedFile) return;

      // Check if the file has changed.
      const fileChanged = hasFileChanged(fileRef.current, droppedFile);

      // Update the file reference and state.
      fileRef.current = droppedFile;
      setFile(droppedFile);

      // Reset the input value to allow re-selecting the same file.
      if (inputRef.current) inputRef.current.value = "";

      if (!fileChanged) return;

      try {
        const { errors, rows } = await parseFile(droppedFile);

        setErrors(errors);

        if (errors.length === 0) options.onComplete?.(rows);
      } catch {
        setErrors([VALIDATION_ERROR.PARSE_FAILED]);
      }
    },
    []
  );

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
      } catch {
        setErrors([VALIDATION_ERROR.PARSE_FAILED]);
      }
    },
    []
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
