import { UseQueryResult } from "@tanstack/react-query";
import { BaseReadRun } from "../../../../types";

export interface Props {
  enaTaxonomyId: UseQueryResult<BaseReadRun[]>;
  taxonomyMatches: number;
}
