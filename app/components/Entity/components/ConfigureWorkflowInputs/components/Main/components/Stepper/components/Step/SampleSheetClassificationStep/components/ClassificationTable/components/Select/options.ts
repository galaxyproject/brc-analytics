import { COLUMN_TYPE } from "../../../../types";

export const OPTIONS: [COLUMN_TYPE, string][] = [
  [COLUMN_TYPE.IDENTIFIER, "Identifier"],
  [COLUMN_TYPE.FORWARD_FILE_URL, "Forward File URL"],
  [COLUMN_TYPE.REVERSE_FILE_URL, "Reverse File URL"],
  [COLUMN_TYPE.BIOLOGICAL_FACTOR, "Biological Factor"],
  [COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR, "Technical/Blocking Factor"],
  [COLUMN_TYPE.OTHER_COVARIATE, "Other Covariate"],
  [COLUMN_TYPE.QC_ONLY, "QC Only"],
  [COLUMN_TYPE.IGNORED, "Ignored"],
];
