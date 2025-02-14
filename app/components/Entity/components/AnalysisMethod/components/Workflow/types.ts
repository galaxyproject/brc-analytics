import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { Props as AnalysisMethodsProps } from "../../../AnalysisMethodsCatalog/types";

export interface Props extends AnalysisMethodsProps {
  workflow: Workflow;
}
