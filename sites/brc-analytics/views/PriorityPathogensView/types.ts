import { type Outbreak } from "@brc/apis/types";
import { type EntitiesResponse } from "@repo/shared/services/staticGeneration/entities/types";

export interface Props {
  data: EntitiesResponse<Outbreak>;
}
