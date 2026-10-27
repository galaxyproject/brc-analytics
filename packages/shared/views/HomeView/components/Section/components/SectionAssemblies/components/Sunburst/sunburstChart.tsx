import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { hierarchy, partition } from "d3-hierarchy";
import { interpolate } from "d3-interpolate";
import { pointer, select } from "d3-selection";
import { arc as d3Arc } from "d3-shape";
import "d3-transition";
import { type JSX, useEffect, useRef, useState } from "react";
import { roma_cyclic } from "./crameri";
import { NodeDetails } from "./nodeDetails";
import { ChartFrame, Layout, Tooltip } from "./sunburst.styles";
import { type ArcCoords, type TaxonomyNode, type TreeNode } from "./types";
import {
  findNodeByName,
  formatAssemblyCount,
  getEquidistantColors,
  getLabelColor,
  getNodeColor,
  getVisibleNodes,
  labelFits,
  layoutRelativeTo,
  truncateLabel,
} from "./utils";

const REVERSED_ROMA_CYCLIC = [...roma_cyclic].reverse();

// Hex rather than the theme's CSS variables: label colours are picked by
// computing contrast against the arc fill.
const LABEL_DARK = "#212B36";
const LABEL_LIGHT = "#FFFFFF";

const WIDTH = 800;
const RADIUS = (WIDTH - 10) / 2;
const LABEL_FONT_SIZE = 11;
const MIN_SCREEN_LABEL_PX = 9;
const LOGO_SIZE = 140;
const ZOOM_MS = 750;

export type SunburstChartProps = {
  data: TaxonomyNode;
  depth: number;
  logoPath: string;
  startingNode: string;
};

/**
 * Describes a taxon for the tooltip, center label and accessible names.
 * @param d - Node to describe.
 * @returns E.g. "phylum · 267 assemblies".
 */
function describe(d: TreeNode): string {
  const count = formatAssemblyCount(d.data.assembly_count);
  return d.data.rank ? `${d.data.rank} · ${count}` : count;
}

export const SunburstChart = ({
  data,
  depth: DEPTH,
  logoPath: LOGO_PATH,
  startingNode,
}: SunburstChartProps): JSX.Element => {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Lets NodeDetails drive the chart.
  const zoomRef = useRef<(p: TreeNode) => void>(null);

  useEffect(() => {
    const frameNode = frameRef.current;
    const svgNode = svgRef.current;
    const tooltipNode = tooltipRef.current;
    if (!frameNode || !svgNode || !tooltipNode) return;
    const frame: HTMLDivElement = frameNode;
    select(svgNode).selectAll("*").remove();

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : ZOOM_MS;
    const ringWidth = RADIUS / DEPTH;

    const svg = select(svgNode)
      .attr("viewBox", [-WIDTH / 2, -WIDTH / 2, WIDTH, WIDTH].join(" "))
      .style("font-family", "'Inter Tight', sans-serif");
    const tooltip = select(tooltipNode);

    const hierarchyData = hierarchy<TaxonomyNode>(data)
      .sum((d) => (d.children.length == 0 ? 1 : 0))
      .sort((a, b) => (a.data.name < b.data.name ? -1 : 1));
    const root = partition<TaxonomyNode>().size([
      2 * Math.PI,
      hierarchyData.height + 1,
    ])(hierarchyData) as TreeNode;
    // Breadth-first, so sorting by it puts the first ring first and in
    // angular order -- the order keyboard focus moves through the arcs.
    const order = new Map<TreeNode, number>();
    root.each((d, i) => order.set(d as TreeNode, i));
    const keyOf = (d: TreeNode): string => String(order.get(d));
    const byOrder = (a: TreeNode, b: TreeNode): number =>
      (order.get(a) ?? 0) - (order.get(b) ?? 0);

    const arc = d3Arc<ArcCoords>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.004))
      .padRadius(RADIUS)
      .innerRadius((d) => Math.min(d.y0, DEPTH) * ringWidth)
      .outerRadius((d) => Math.max(0, Math.min(d.y1, DEPTH) * ringWidth - 1));

    // Labels are sized in viewBox units, so on a small screen the chart's
    // scale-down would shrink them past reading. Keep them at least
    // MIN_SCREEN_LABEL_PX on screen, capped so a phone still gets some.
    let fontSize = LABEL_FONT_SIZE;
    const updateFontSize = (): boolean => {
      const rendered = svgNode.getBoundingClientRect().width;
      const next = rendered
        ? Math.min(
            22,
            Math.max(LABEL_FONT_SIZE, (MIN_SCREEN_LABEL_PX * WIDTH) / rendered)
          )
        : LABEL_FONT_SIZE;
      const changed = Math.abs(next - fontSize) > 0.5;
      fontSize = next;
      return changed;
    };
    updateFontSize();

    // First-ring labels sit a little further out, clear of the center.
    function labelTransform(
      d: TreeNode,
      coords: ArcCoords,
      center: TreeNode
    ): string {
      const angle = ((coords.x0 + coords.x1) / 2) * (180 / Math.PI);
      let r =
        ((Math.min(coords.y0, DEPTH) + Math.min(coords.y1, DEPTH)) / 2) *
        ringWidth;
      if (d.parent === center) r += 10;
      return `rotate(${angle - 90}) translate(${r},0) rotate(${angle < 180 ? 0 : 180})`;
    }

    const arcLayer = svg.append("g");
    const labelLayer = svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr("aria-hidden", "true")
      .style("font-weight", 500);

    const centerGroup = svg
      .append("g")
      .attr("aria-hidden", "true")
      .style("pointer-events", "none");
    const logoImage = centerGroup
      .append("image")
      .attr("x", -LOGO_SIZE / 2)
      .attr("y", -LOGO_SIZE / 2)
      .attr("width", LOGO_SIZE)
      .attr("height", LOGO_SIZE)
      .attr("href", LOGO_PATH)
      .attr("preserveAspectRatio", "xMidYMid meet");
    const centerName = centerGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", -4)
      .attr("fill", LABEL_DARK)
      .style("font-size", "18px")
      .style("font-weight", 500);
    const centerDetail = centerGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 18)
      .attr("fill", PALETTE.INK_LIGHT)
      .style("font-size", "13px");
    const centerHint = centerGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 40)
      .attr("fill", PALETTE.INK_LIGHT)
      .style("font-size", "11px")
      .text("Click to zoom out");

    let currentRoot = root;

    function hideTooltip(): void {
      tooltip.style("opacity", 0);
    }

    function showTooltip(event: MouseEvent, d: TreeNode): void {
      const [x, y] = pointer(event, frame);
      tooltip.selectAll("*").remove();
      tooltip.append("strong").text(d.data.name);
      tooltip.append("span").text(describe(d));
      // Flip to the left of the pointer in the right half, so it stays in
      // the frame.
      const flip = x > frame.clientWidth / 2;
      const left = flip ? "calc(" + (x - 12) + "px - 100%)" : x + 12 + "px";
      tooltip
        .style("opacity", 1)
        .style("transform", `translate(${left}, ${y + 12}px)`);
    }

    // The center doubles as the zoom-out button.
    const zoomOut = svg
      .append("circle")
      .attr("r", ringWidth - 2)
      .attr("fill", "transparent")
      .attr("stroke", "none")
      .on("click", () => {
        if (currentRoot.parent) zoomTo(currentRoot.parent as TreeNode);
      })
      .on("keydown", (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!currentRoot.parent) return;
        const from = currentRoot;
        zoomTo(currentRoot.parent as TreeNode);
        // Focus lands on the arc just zoomed out of.
        arcLayer
          .selectAll<SVGPathElement, TreeNode>("path")
          .filter((d) => d === from)
          .node()
          ?.focus();
      });

    function updateCenter(p: TreeNode): void {
      const isRoot = p.depth === 0;
      const parentName =
        p.depth === 1 ? "All taxa" : (p.parent as TreeNode | null)?.data.name;
      logoImage.style("opacity", isRoot ? 1 : 0);
      centerName.text(
        isRoot ? "" : truncateLabel(p.data.name, 2 * ringWidth - 24, 18)
      );
      centerDetail.text(isRoot ? "" : describe(p));
      centerHint.style("opacity", isRoot ? 0 : 1);
      zoomOut
        .style("cursor", isRoot ? "default" : "pointer")
        .attr("tabindex", isRoot ? null : 0)
        .attr("role", isRoot ? null : "button")
        .attr("aria-label", isRoot ? null : `Zoom out to ${parentName}`);
      svg.attr(
        "aria-label",
        isRoot
          ? "Assemblies by taxonomic lineage"
          : `Assemblies by taxonomic lineage, centred on ${p.data.name}`
      );
    }

    function colorsFor(center: TreeNode): (d: TreeNode) => string {
      const childColors = getEquidistantColors(
        REVERSED_ROMA_CYCLIC,
        center.children?.length ?? 0
      );
      return (d) => getNodeColor(d, center, childColors);
    }

    function renderLabels(
      next: TreeNode[],
      center: TreeNode,
      from: Map<TreeNode, ArcCoords> | null
    ): void {
      const colorOf = colorsFor(center);
      labelLayer.style("font-size", `${fontSize}px`);
      const labelNodes = next.filter((d) =>
        labelFits(d.target, ringWidth, DEPTH, fontSize)
      );
      const label = labelLayer
        .selectAll<SVGTextElement, TreeNode>("text")
        .data(labelNodes, keyOf)
        .join((enter) => enter.append("text").attr("dy", "0.35em"))
        .attr("fill", (d) => getLabelColor(colorOf(d), LABEL_DARK, LABEL_LIGHT))
        .text((d) =>
          truncateLabel(
            d.data.name,
            ringWidth - (d.parent === center ? 22 : 10),
            fontSize
          )
        );
      if (!from || duration === 0) {
        label.attr("transform", (d) => labelTransform(d, d.target, center));
        return;
      }
      label
        .transition()
        .duration(duration)
        .attrTween("transform", (d) => {
          const i = interpolate(from.get(d) ?? d.current, d.target);
          return (t: number): string => labelTransform(d, i(t), center);
        });
    }

    // Only the arcs visible before or after a zoom are in the DOM: a few
    // hundred at most, where drawing every node meant tweening ~3,900 paths
    // and labels on every animation frame.
    function render(center: TreeNode, animate: boolean): void {
      const previousCenter = currentRoot;
      const next = getVisibleNodes(center, DEPTH);
      const nextSet = new Set(next);
      const rendered = new Set(
        arcLayer.selectAll<SVGPathElement, TreeNode>("path").data()
      );
      const nodes = [...rendered, ...next.filter((d) => !rendered.has(d))];
      for (const d of nodes) {
        // Arriving arcs start where they'd have been under the old center
        // (collapsed out of sight) and grow into place.
        if (!rendered.has(d)) d.current = layoutRelativeTo(d, previousCenter);
        d.target = layoutRelativeTo(d, center);
      }
      currentRoot = center;
      const colorOf = colorsFor(center);

      const path = arcLayer
        .selectAll<SVGPathElement, TreeNode>("path")
        .data(nodes, keyOf)
        .join((enter) =>
          enter
            .append("path")
            .attr("d", (d) => arc(d.current))
            .attr("stroke", PALETTE.COMMON_WHITE)
            .attr("stroke-width", 1)
            .on("mousemove", showTooltip)
            .on("mouseleave", hideTooltip)
            .on("click", (_event, d) => zoomTo(d))
            .on("keydown", (event: KeyboardEvent, d) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              zoomTo(d);
              zoomOut.node()?.focus();
            })
        )
        .sort(byOrder);
      // Only the first ring takes focus: a tab stop per visible arc would
      // be hundreds. Deeper levels are a zoom (or a panel entry) away.
      path
        .attr("tabindex", (d) => (d.parent === center ? 0 : null))
        .attr("role", (d) => (d.parent === center ? "button" : null))
        .attr("aria-label", (d) =>
          d.parent === center ? `${d.data.name}, ${describe(d)}` : null
        );
      // Leaving arcs keep their colour; they have no place under the new
      // center to take one from.
      path
        .filter((d) => nextSet.has(d) && (!animate || !rendered.has(d)))
        .attr("fill", colorOf);

      // Snapshot start positions: the path tweens rewrite d.current as they
      // run, and the label tweens must start from the same place.
      const from = new Map(nodes.map((d) => [d, d.current]));
      if (!animate || duration === 0) {
        path
          .filter((d) => nextSet.has(d))
          .attr("fill", colorOf)
          .attr("d", (d) => arc(d.target))
          .each((d) => {
            d.current = d.target;
          });
        path.filter((d) => !nextSet.has(d)).remove();
        renderLabels(next, center, null);
        return;
      }
      path
        .filter((d) => nextSet.has(d) && rendered.has(d))
        .transition("fill")
        .duration(duration)
        .attr("fill", colorOf);
      path
        .transition()
        .duration(duration)
        .attrTween("d", (d) => {
          const i = interpolate(from.get(d) ?? d.current, d.target);
          return (t: number): string => {
            d.current = i(t);
            return arc(d.current) ?? "";
          };
        })
        .on("end", function (d) {
          if (!nextSet.has(d)) select(this).remove();
        });
      renderLabels(next, center, from);
    }

    function zoomTo(p: TreeNode, animate = true): void {
      hideTooltip();
      updateCenter(p);
      setSelectedNode(p);
      render(p, animate);
    }

    zoomRef.current = zoomTo;
    zoomTo(root, false);
    const start = findNodeByName(root, startingNode);
    if (start !== root) zoomTo(start, false);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (updateFontSize()) {
              renderLabels(
                getVisibleNodes(currentRoot, DEPTH),
                currentRoot,
                null
              );
            }
          });
    resizeObserver?.observe(svgNode);

    return (): void => {
      resizeObserver?.disconnect();
      hideTooltip();
      select(svgNode).selectAll("*").interrupt().remove();
    };
  }, [data, DEPTH, LOGO_PATH, startingNode]);

  return (
    <Layout>
      <ChartFrame ref={frameRef}>
        <svg ref={svgRef} role="group" />
        <Tooltip aria-hidden="true" ref={tooltipRef} />
      </ChartFrame>
      {selectedNode ? (
        <NodeDetails
          node={selectedNode}
          onNodeClick={(node) => zoomRef.current?.(node)}
        />
      ) : (
        <div />
      )}
    </Layout>
  );
};

export default SunburstChart;
