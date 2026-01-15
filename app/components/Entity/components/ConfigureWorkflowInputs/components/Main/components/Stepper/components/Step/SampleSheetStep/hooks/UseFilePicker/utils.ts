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
