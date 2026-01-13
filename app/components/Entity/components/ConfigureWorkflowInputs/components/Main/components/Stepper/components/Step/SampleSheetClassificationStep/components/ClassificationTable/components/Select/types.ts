import { ColumnClassifications } from "../../../../types";
import { OnClassify } from "../../../../hooks/UseColumnClassification/types";
import { COLUMN_TYPE } from "../../../../types";

export interface Props {
  classifications: ColumnClassifications;
  columnName: string;
  columnType: COLUMN_TYPE | null;
  onClassify: OnClassify;
}
