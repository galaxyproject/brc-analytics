import { type Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { type EntitiesResponse } from "@repo/shared/services/staticGeneration/entities/types";

export interface Props {
  data: EntitiesResponse<Outbreak>;
}
