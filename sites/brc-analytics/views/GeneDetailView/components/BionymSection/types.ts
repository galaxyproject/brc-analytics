import {
  type BionymClaim,
  type BionymClaims,
  type BionymSource,
} from "@repo/shared/services/genes/types";

export interface BionymSectionProps {
  bionym: BionymClaims;
}

export interface ClaimItemProps {
  claim: BionymClaim;
}

export interface SourceListViewProps {
  sources: BionymSource[];
}
