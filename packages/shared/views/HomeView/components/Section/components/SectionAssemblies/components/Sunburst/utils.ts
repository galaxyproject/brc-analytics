import { type LinkProps } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { hsl, rgb } from "d3-color";
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
 * their center-child ancestor's, lightened and desaturated a step per ring,
 * with every other sibling a shade darker so neighbouring arcs in the pale
 * outer rings stay distinguishable.
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
  const siblingIndex = node.parent?.children?.indexOf(node) ?? 0;
  const shade = siblingIndex % 2 === 1 ? -0.05 : 0;
  return hsl(
    base.h,
    Math.max(0, base.s - 0.08 * steps),
    Math.min(0.92, base.l + 0.06 * steps + shade)
  ).toString();
}

/**
 * Relative luminance of an sRGB colour (WCAG 2).
 * @param color - CSS colour.
 * @returns Luminance from 0 (black) to 1 (white).
 */
function luminance(color: string): number {
  const { b, g, r } = rgb(color);
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Picks dark or light label text, whichever contrasts more with the fill.
 * @param fill - Arc fill colour.
 * @param dark - Dark text colour.
 * @param light - Light text colour.
 * @returns The text colour to use.
 */
export function getLabelColor(
  fill: string,
  dark: string,
  light: string
): string {
  const contrast = (a: number, b: number): number =>
    (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const l = luminance(fill);
  return contrast(l, luminance(dark)) >= contrast(l, luminance(light))
    ? dark
    : light;
}

/**
 * Whether a label fits across its arc: radial labels need the arc to be at
 * least a line of text wide where the label sits.
 * @param coords - Arc coordinates.
 * @param ringWidth - Radial thickness of one ring, in px.
 * @param depth - Rings including the center disc.
 * @param fontSize - Label font size, in px.
 * @returns True if the label fits.
 */
export function labelFits(
  coords: ArcCoords,
  ringWidth: number,
  depth: number,
  fontSize: number
): boolean {
  const midRadius =
    ((Math.min(coords.y0, depth) + Math.min(coords.y1, depth)) / 2) * ringWidth;
  return (coords.x1 - coords.x0) * midRadius >= fontSize * 1.2;
}

/**
 * Shortens a label to fit a length, ending it with an ellipsis. Widths are
 * estimated from an average glyph width, since SVG text can't be measured
 * before it is laid out (and jsdom can't measure it at all).
 * @param text - Label text.
 * @param maxWidth - Available length, in px.
 * @param fontSize - Font size, in px.
 * @returns The label, shortened if needed.
 */
export function truncateLabel(
  text: string,
  maxWidth: number,
  fontSize: number
): string {
  const maxChars = Math.floor(maxWidth / (fontSize * 0.56));
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return "";
  return text.slice(0, maxChars - 1).trimEnd() + "\u2026";
}

/**
 * "1 assembly", "12 assemblies".
 * @param count - Number of assemblies.
 * @returns The count with its noun.
 */
export function formatAssemblyCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "assembly" : "assemblies"}`;
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
