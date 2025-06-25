import { Outbreak } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { EntitiesResponse } from "../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  data: EntitiesResponse<Outbreak>;
}
