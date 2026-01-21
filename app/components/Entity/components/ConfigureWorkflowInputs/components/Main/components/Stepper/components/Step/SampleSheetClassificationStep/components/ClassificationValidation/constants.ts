import { COLUMN_TYPE } from "../../types";

export const VALIDATION_LABELS: Record<
  Extract<
    COLUMN_TYPE,
    | COLUMN_TYPE.BIOLOGICAL_FACTOR
    | COLUMN_TYPE.FORWARD_FILE_URL
    | COLUMN_TYPE.REVERSE_FILE_URL
    | COLUMN_TYPE.IDENTIFIER
  >,
  string
> = {
  [COLUMN_TYPE.BIOLOGICAL_FACTOR]: "At least one biological factor specified",
  [COLUMN_TYPE.FORWARD_FILE_URL]: "One forward file URL specified",
  [COLUMN_TYPE.REVERSE_FILE_URL]: "One reverse file URL specified",
  [COLUMN_TYPE.IDENTIFIER]: "One identifier column specified",
};
