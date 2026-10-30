import { type LinkProps } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { hcl, hsl, rgb } from "d3-color";
import { type ArcCoords, type TreeNode } from "./types";

const TAU = 2 * Math.PI;

/**
 * First-ring colours, handed out largest arc first: muted natural tones,
 * with lightness spread so neighbouring ranks stay apart under red-green
 * and blue-yellow colour blindness.
 */
export const FIRST_RING_COLORS = [
  "#3F6E8C",
  "#C08040",
  "#5E9A74",
  "#8F3F3F",
  "#B98DB3",
  "#66702F",
  "#9CC2B4",
  "#D9B65E",
];

// Width of the hue band, in degrees, that a first-ring arc's descendants
// spread across around its colour.
const HUE_BAND = 50;

/**
 * Colours for the children of the chart's center, assigned by size so the
 * biggest arcs get the most distinct colours whatever their names.
 * @param center - Node the chart is centred on.
 * @param colors - Colours to hand out, best first; cycled if outnumbered.
 * @returns One colour per child of `center`, in child order.
 */
export function getChildColors(center: TreeNode, colors: string[]): string[] {
  const children = center.children ?? [];
  const bySize = children
    .map((child, i) => ({ i, value: child.value ?? 0 }))
    .sort((a, b) => b.value - a.value || a.i - b.i);
  const result: string[] = new Array(children.length);
  bySize.forEach(({ i }, rank) => {
    result[i] = colors[rank % colors.length];
  });
  return result;
}

/**
 * Hue offset of `node` within a band, Tree Colors style (Tennekes & de
 * Jonge, 2014): each node's slice of the band is split among its children,
 * with a gap between slices so siblings stay apart, and interleaved so
 * neighbouring arcs come from opposite halves of their parent's slice.
 * @param node - A descendant of `from`.
 * @param from - Node that owns the whole band.
 * @param band - Band width, in degrees.
 * @returns Offset from the start of the band, in degrees.
 */
function getHueOffset(node: TreeNode, from: TreeNode, band: number): number {
  const path = node
    .ancestors()
    .slice(0, node.depth - from.depth)
    .reverse();
  let start = 0;
  let end = band;
  for (const step of path) {
    const siblings = step.parent?.children ?? [step];
    const n = siblings.length;
    const i = siblings.indexOf(step);
    const slot = i % 2 === 0 ? i / 2 : Math.ceil(n / 2) + (i - 1) / 2;
    const width = (end - start) / n;
    const mid = start + width * (slot + 0.5);
    start = mid - width * 0.4;
    end = mid + width * 0.4;
  }
  return (start + end) / 2;
}

/**
 * Colour of a node's arc when the chart is centred on `center`. Each child
 * of the center takes its own colour; deeper nodes take a hue near their
 * center-child ancestor's, picked by their place in the tree so siblings and
 * cousins differ, lightened a little per ring but kept close to its
 * saturation so the outer rings don't wash out.
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
  // Shift the hue in HCL so it moves without changing perceived lightness.
  const base = hcl(childColors[index]);
  const hue = base.h - HUE_BAND / 2 + getHueOffset(node, centerChild, HUE_BAND);
  const shifted = hsl(hcl(hue, base.c, base.l).rgb());
  return hsl(
    shifted.h,
    Math.max(0, shifted.s - 0.03 * steps),
    Math.min(0.85, shifted.l + 0.045 * steps)
  ).toString();
}

/**
 * Outline for an arc: a darker shade of its own fill, which separates
 * neighbouring arcs without drawing a uniform web over the chart.
 * @param fill - Arc fill colour.
 * @returns A CSS colour.
 */
export function getArcStroke(fill: string): string {
  return hsl(fill).darker(0.9).toString();
}

/**
 * Whether `node` is `focus` itself, one of its ancestors or one of its
 * descendants -- the arcs left lit when `focus` is hovered.
 * @param node - Node to test.
 * @param focus - Hovered node.
 * @returns True if `node` is in `focus`'s lineage.
 */
export function isInLineage(node: TreeNode, focus: TreeNode): boolean {
  return focus.ancestors().includes(node) || node.ancestors().includes(focus);
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
  if (Math.min(coords.y1, depth) <= coords.y0) return false;
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
