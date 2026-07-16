/**
 * Checks if a file has changed by comparing metadata.
 * @param prevFile - The previous file.
 * @param newFile - The new file.
 * @returns True if the file has changed, false otherwise.
 */
export function hasFileChanged(prevFile: File | null, newFile: File): boolean {
  if (!prevFile) return true;

  return (
    prevFile.name !== newFile.name ||
    prevFile.size !== newFile.size ||
    prevFile.lastModified !== newFile.lastModified
  );
}

/**
 * Checks if the file picker state is valid.
 * @param file - The selected file.
 * @param errors - The validation errors.
 * @returns True if a file is selected and there are no errors.
 */
export function isValid(file: File | null, errors: string[]): boolean {
  return file !== null && errors.length === 0;
}
