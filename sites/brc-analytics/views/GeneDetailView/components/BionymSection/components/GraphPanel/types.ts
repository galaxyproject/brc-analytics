import { type MinConfidenceProps } from "@brc/views/GeneDetailView/components/BionymSection/types";
import {
  type BionymGraph,
  type BionymGraphEdge,
  type BionymGraphNode,
} from "@repo/shared/services/genes/types";

export interface GraphPanelProps extends MinConfidenceProps {
  geneUid: string;
}

export interface GraphExplorerProps extends MinConfidenceProps {
  graph: BionymGraph;
}

// How many of a graph's nodes and edges are shown.
export interface GraphCounts {
  edges: number;
  nodes: number;
}

// A node's edge, seen from the node: the edge, and the node at its other end.
export interface NodeEdge {
  edge: BionymGraphEdge;
  other: BionymGraphNode | undefined;
  outgoing: boolean;
}
