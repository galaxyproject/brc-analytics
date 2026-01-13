import { COLUMN_TYPE } from "../../../../types";

export const OPTIONS: [COLUMN_TYPE, string][] = [
  [COLUMN_TYPE.IDENTIFIER, "Identifier"],
  [COLUMN_TYPE.FORWARD_FILE_PATH, "Forward File Path"],
  [COLUMN_TYPE.REVERSE_FILE_PATH, "Reverse File Path"],
  [COLUMN_TYPE.BIOLOGICAL_FACTOR, "Biological Factor"],
  [COLUMN_TYPE.TECHNICAL_BLOCKING, "Technical/Blocking"],
  [COLUMN_TYPE.OTHER_COVARIATE, "Other Covariate"],
  [COLUMN_TYPE.QC_ONLY, "QC Only"],
  [COLUMN_TYPE.IGNORED, "Ignored"],
];
