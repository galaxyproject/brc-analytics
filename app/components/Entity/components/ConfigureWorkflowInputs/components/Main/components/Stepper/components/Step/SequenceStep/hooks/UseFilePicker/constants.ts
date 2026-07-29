export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_SEQUENCE_LENGTH = 5000;
export const MIN_SEQUENCE_LENGTH = 50;

export const VALIDATION_ERROR = {
  EMPTY_CONTENT: "File is empty",
  FILE_TOO_LARGE: "File size must be under 2MB",
  INVALID_FASTA: "File must be in FASTA format (starting with >)",
  MULTIPLE_SEQUENCES: "File must contain only a single sequence",
  PARSE_FAILED: "Failed to read file",
  SEQUENCE_TOO_LONG: "Sequence must be at most 5000 bases",
  SEQUENCE_TOO_SHORT: "Sequence must be at least 50 bases",
} as const;
