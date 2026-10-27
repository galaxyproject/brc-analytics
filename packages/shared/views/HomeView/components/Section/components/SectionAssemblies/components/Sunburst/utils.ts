import { type LinkProps } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { hsl } from "d3-color";
import { interpolateRgb, piecewise } from "d3-interpolate";
import { type ArcCoords, type TreeNode } from "./types";

const TAU = 2 * Math.PI;

/**
 * Picks `count` colours spread evenly around a colour map, interpolating
 * (gamma-corrected RGB) when more are asked for than the map holds.
 * @param colorMap - Colours to sample from.
 * @param count - Number of colours wanted.
 * @returns The sampled colours.
 */
export function getEquidistantColors(
  colorMap: string[],
  count: number
): string[] {
  if (count <= 0) return [];
  if (count === 1) return [colorMap[0]];
  if (count <= colorMap.length) {
    const step = colorMap.length / count;
    return Array.from(
      { length: count },
      (_, i) => colorMap[Math.floor(i * step)]
    );
  }
  const scale = piecewise(interpolateRgb.gamma(2.2), colorMap);
  return Array.from({ length: count }, (_, i) => scale(i / (count - 1)));
}

/**
 * Colour of a node's arc when the chart is centred on `center`. Each child
 * of the center takes its own colour by sibling position; deeper nodes take
 * their center-child ancestor's, lightened and desaturated a step per ring.
 * @param node - A descendant of `center`.
 * @param center - Node the chart is centred on.
 * @param childColors - One colour per child of `center`, in order.
 * @returns A CSS colour.
 */
export function getNodeColor(
  node: TreeNode,
  center: TreeNode,
  childColors: string[]
): string {
  let centerChild = node;
  while (centerChild.parent && centerChild.parent !== center) {
    centerChild = centerChild.parent as TreeNode;
  }
  const index = center.children?.indexOf(centerChild) ?? -1;
  if (index < 0) return "#ccc";
  const steps = node.depth - center.depth - 1;
  if (steps === 0) return childColors[index];
  const base = hsl(childColors[index]);
  return hsl(
    base.h,
    Math.max(0, base.s - 0.1 * steps),
    Math.min(1, base.l + 0.05 * steps)
  ).toString();
}

/**
 * Where a node's arc sits when the chart is centred on `center`: the
 * center's angular span stretched to the full circle, and rings counted
 * from the center outward. Nodes outside the center's subtree collapse to
 * zero angle at the edge of its span.
 * @param node - Node to place.
 * @param center - Node the chart is centred on.
 * @returns The node's arc coordinates.
 */
export function layoutRelativeTo(node: TreeNode, center: TreeNode): ArcCoords {
  const span = center.x1 - center.x0;
  const clamp = (x: number): number =>
    Math.max(0, Math.min(1, (x - center.x0) / span)) * TAU;
  return {
    x0: clamp(node.x0),
    x1: clamp(node.x1),
    y0: Math.max(0, node.y0 - center.depth),
    y1: Math.max(0, node.y1 - center.depth),
  };
}

/**
 * The nodes drawn as arcs when the chart is centred on `center`: its
 * descendants in the `depth - 1` rings around it. Walks only that part of
 * the tree, so it costs what is on screen rather than the whole taxonomy.
 * @param center - Node the chart is centred on.
 * @param depth - Rings including the center disc.
 * @returns Visible nodes, in tree order.
 */
export function getVisibleNodes(center: TreeNode, depth: number): TreeNode[] {
  const visible: TreeNode[] = [];
  const walk = (node: TreeNode, relativeDepth: number): void => {
    if (relativeDepth >= depth) return;
    if (relativeDepth > 0) visible.push(node);
    for (const child of (node.children ?? []) as TreeNode[]) {
      walk(child, relativeDepth + 1);
    }
  };
  walk(center, 0);
  return visible;
}

/**
 * Whether an arc spans at least 1% of the circle, the threshold for
 * drawing its label.
 * @param coords - Arc coordinates.
 * @returns True if the arc is wide enough for a label.
 */
export function isLargeEnoughForLabel(coords: ArcCoords): boolean {
  return (coords.x1 - coords.x0) / TAU >= 0.01;
}

/**
 * Finds a node by taxon name.
 * @param root - Tree to search.
 * @param name - Taxon name.
 * @returns The first node with that name, or the root if none matches.
 */
export function findNodeByName(root: TreeNode, name: string): TreeNode {
  return (root.find((d) => d.data.name === name) as TreeNode) ?? root;
}

/* eslint-disable sort-keys -- Keep these in natural order of hierarchy */
const RANK_CATEGORY_KEYS: Record<string, string> = {
  isolate: "taxonomicLevelIsolate",
  serotype: "taxonomicLevelSerotype",
  strain: "taxonomicLevelStrain",
  species: "taxonomicLevelSpecies",
  genus: "taxonomicLevelGenus",
  family: "taxonomicLevelFamily",
  order: "taxonomicLevelOrder",
  class: "taxonomicLevelClass",
  phylum: "taxonomicLevelPhylum",
  kingdom: "taxonomicLevelKingdom",
  domain: "taxonomicLevelDomain",
  realm: "taxonomicLevelRealm",
};
/* eslint-enable sort-keys -- re-enable sort keys */

/**
 * Builds the assemblies-table URL filtered to one taxon.
 * @param rank - Taxonomic rank of the taxon.
 * @param name - Taxon name.
 * @returns A link URL, or "" when the rank has no matching filter.
 */
export function createFilterUrl(
  rank?: string,
  name?: string
): LinkProps["url"] {
  if (!rank || !name) return "";
  const categoryKey = RANK_CATEGORY_KEYS[rank.toLowerCase()];
  if (!categoryKey) return "";
  const filter = [{ categoryKey, value: [name] }];
  return {
    href: "/data/assemblies",
    query: encodeURIComponent(JSON.stringify({ filter })),
  };
}
