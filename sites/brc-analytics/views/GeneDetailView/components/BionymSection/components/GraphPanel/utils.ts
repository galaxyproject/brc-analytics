import {
  type BionymGraph,
  type BionymGraphEdge,
  type BionymGraphNode,
} from "@repo/shared/services/genes/types";
import { type BionymComponentsGraph } from "bionym-components";
import { type GraphCounts, type NodeEdge } from "./types";

/**
 * The graph in the shape BioNym's components read, with its root given as
 * metadata.query, which they always keep.
 * @param graph - The gene's graph, as the API gives it.
 * @returns The graph for BioNym's components.
 */
export function toComponentsGraph(graph: BionymGraph): BionymComponentsGraph {
  return {
    edges: graph.edges,
    metadata: { query: graph.query },
    nodes: graph.nodes,
  };
}

/**
 * The graph without the hidden kinds of edge or types of node, and without the
 * nodes that leaves with no edges. The gene's own node is always kept.
 * @param graph - The gene's graph.
 * @param hiddenPredicates - The kinds of edge to hide.
 * @param hiddenTypes - The types of node to hide.
 * @returns The graph to draw.
 */
export function filterGraph(
  graph: BionymGraph,
  hiddenPredicates: ReadonlySet<string>,
  hiddenTypes: ReadonlySet<string>
): BionymGraph {
  const typeOf = new Map(graph.nodes.map((node) => [node.id, node.type]));
  const isShown = (id: string): boolean =>
    !hiddenTypes.has(typeOf.get(id) ?? "");
  const edges = graph.edges.filter(
    (edge) =>
      !hiddenPredicates.has(edge.predicate) &&
      isShown(edge.subject) &&
      isShown(edge.object)
  );
  const kept = shownNodeIds(graph.query, edges);
  return {
    ...graph,
    edges,
    nodes: graph.nodes.filter((node) => kept.has(node.id)),
  };
}

/**
 * How many of a graph's nodes and edges are shown at a minimum confidence, as
 * BioNym's network shows them: the edges at or above it, the nodes they join,
 * and the gene's own node.
 * @param graph - The graph drawn.
 * @param minConfidence - The lowest confidence shown.
 * @returns The counts.
 */
export function countShown(
  graph: BionymGraph,
  minConfidence: number
): GraphCounts {
  const edges = graph.edges.filter((edge) => edge.confidence >= minConfidence);
  return { edges: edges.length, nodes: shownNodeIds(graph.query, edges).size };
}

/**
 * The nodes a set of edges shows: the nodes they join, and the gene's own
 * node, which is always shown.
 * @param query - The id of the gene's own node.
 * @param edges - The edges shown.
 * @returns The ids of the nodes shown.
 */
function shownNodeIds(query: string, edges: BionymGraphEdge[]): Set<string> {
  const ids = new Set([query]);
  for (const edge of edges) {
    ids.add(edge.subject);
    ids.add(edge.object);
  }
  return ids;
}

/**
 * The graph's kinds of edge, each with how many edges it has, most first.
 * @param graph - The gene's graph.
 * @returns Each kind of edge and its count.
 */
export function countPredicates(graph: BionymGraph): [string, number][] {
  const counts = new Map<string, number>();
  for (const edge of graph.edges) {
    counts.set(edge.predicate, (counts.get(edge.predicate) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * A node's edges shown at a minimum confidence, each with the node at its
 * other end, highest confidence first.
 * @param graph - The graph drawn.
 * @param nodeId - The node.
 * @param minConfidence - The lowest confidence shown.
 * @returns The node's edges.
 */
export function nodeEdges(
  graph: BionymGraph,
  nodeId: string,
  minConfidence: number
): NodeEdge[] {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  return graph.edges
    .filter(
      (edge) =>
        edge.confidence >= minConfidence &&
        (edge.subject === nodeId || edge.object === nodeId)
    )
    .map((edge) => {
      const outgoing = edge.subject === nodeId;
      return {
        edge,
        other: byId.get(outgoing ? edge.object : edge.subject),
        outgoing,
      };
    })
    .sort((a, b) => b.edge.confidence - a.edge.confidence);
}

/**
 * The node's link, if it is an https: URL. The API passes only https: links;
 * this checks again before a link is drawn, since a link with another scheme,
 * such as javascript:, can run code when clicked.
 * @param node - A node.
 * @returns The link, or null.
 */
export function httpsUrl(node: BionymGraphNode): string | null {
  if (!node.url) return null;
  try {
    return new URL(node.url).protocol === "https:" ? node.url : null;
  } catch {
    return null;
  }
}
