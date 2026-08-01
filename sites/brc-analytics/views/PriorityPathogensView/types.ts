import {
  type EntitiesResponse,
  type Outbreak,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  data: EntitiesResponse<Outbreak>;
}
