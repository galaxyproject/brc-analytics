export const MAX_FILE_SIZE_BYTES = 50 * 1024; // 50KB
export const MAX_SEQUENCE_LENGTH = 5000;
export const MIN_SEQUENCE_LENGTH = 30;

export const VALIDATION_ERROR = {
  EMPTY_CONTENT: "File is empty",
  FILE_TOO_LARGE: "File size must be under 50KB",
  INVALID_FASTA: "File must be in FASTA format (starting with >)",
  MULTIPLE_SEQUENCES: "File must contain only a single sequence",
  PARSE_FAILED: "Failed to read file",
  SEQUENCE_TOO_LONG: `Sequence must be at most ${MAX_SEQUENCE_LENGTH} bases`,
  SEQUENCE_TOO_SHORT: `Sequence must be at least ${MIN_SEQUENCE_LENGTH} bases`,
} as const;
