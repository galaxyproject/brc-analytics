export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const VALIDATION_ERROR = {
  EMPTY_CONTENT: "File is empty",
  FILE_TOO_LARGE: "File size must be under 2MB",
  INVALID_FASTA: "File must be in FASTA format (starting with >)",
  PARSE_FAILED: "Failed to read file",
} as const;
