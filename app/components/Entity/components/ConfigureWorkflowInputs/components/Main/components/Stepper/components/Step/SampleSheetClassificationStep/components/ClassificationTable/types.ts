import { ColumnClassifications } from "../../types";
import { OnClassify } from "../../hooks/UseColumnClassification/types";

export interface Props {
  classifications: ColumnClassifications;
  onClassify: OnClassify;
}
