import { type MinConfidenceProps } from "@brc/views/GeneDetailView/components/BionymSection/types";
import {
  type BionymClaim,
  type BionymClaims,
  type BionymSource,
} from "@repo/shared/services/genes/types";

export interface ClaimsPanelProps extends MinConfidenceProps {
  bionym: BionymClaims;
}

export interface ClaimItemProps {
  claim: BionymClaim;
}

export interface SourceListViewProps {
  sources: BionymSource[];
}
