import { Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { EntitiesResponse } from "@brc-analytics/core/services/staticGeneration/entities/types";

export interface Props {
  data: EntitiesResponse<Outbreak>;
}
