import { type BionymGraph } from "@repo/shared/services/genes/types";

export interface OverviewViewProps {
  graph: BionymGraph;
  // Called with the type of node whose bar was clicked.
  onTypeClick: (nodeType: string) => void;
}
