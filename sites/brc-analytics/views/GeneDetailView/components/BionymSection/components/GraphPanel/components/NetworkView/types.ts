import { type BionymGraph } from "@repo/shared/services/genes/types";

export interface NetworkViewProps {
  graph: BionymGraph;
  minConfidence: number;
  // Called with the id of the node clicked, or null when no node is selected:
  // after a click that clears it, and after each redraw, which clears it too.
  onSelect: (nodeId: string | null) => void;
}
