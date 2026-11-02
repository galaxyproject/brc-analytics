import { type Gene } from "@repo/shared/services/genes/types";

export interface GeneDetailViewProps {
  gene: Gene;
}

export interface GeneStatusViewProps {
  message: string;
}
