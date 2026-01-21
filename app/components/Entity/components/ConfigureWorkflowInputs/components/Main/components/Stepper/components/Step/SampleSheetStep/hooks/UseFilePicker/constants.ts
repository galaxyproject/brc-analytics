export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MIN_DATA_ROWS = 2;
export const MIN_COLUMNS = 4;

export const VALIDATION_ERROR = {
  FILE_TOO_LARGE: "File size must be under 2MB",
  INSUFFICIENT_COLUMNS: "Must have at least 4 columns",
  INSUFFICIENT_ROWS: "Must have at least 2 data rows",
  PARSE_FAILED: "Failed to parse file",
} as const;
