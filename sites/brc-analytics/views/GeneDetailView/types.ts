import {
  type BionymClaims,
  type Gene,
} from "@repo/shared/services/genes/types";

export interface GeneDetailViewProps {
  // The claims in the gene's BioNym graph; null when it has none.
  bionym: BionymClaims | null;
  gene: Gene;
}

export interface GeneStatusViewProps {
  message: string;
}
