import {
  type BionymGraph,
  type BionymGraphNode,
} from "@repo/shared/services/genes/types";

export interface NodeDetailProps {
  graph: BionymGraph;
  minConfidence: number;
  node: BionymGraphNode;
}
