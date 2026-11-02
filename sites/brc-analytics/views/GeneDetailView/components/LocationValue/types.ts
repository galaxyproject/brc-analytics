import { type GeneLocation } from "@repo/shared/services/genes/types";

export interface LocationValueProps {
  location: GeneLocation;
  ucscBrowserUrl: string | null;
}
