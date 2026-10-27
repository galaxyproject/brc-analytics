import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { hierarchy, partition } from "d3-hierarchy";
import { interpolate } from "d3-interpolate";
import { select } from "d3-selection";
import { arc as d3Arc } from "d3-shape";
import "d3-transition";
import { type JSX, useEffect, useRef, useState } from "react";
import { roma_cyclic } from "./crameri";
import { NodeDetails } from "./nodeDetails";
import { type ArcCoords, type TaxonomyNode, type TreeNode } from "./types";
import {
  findNodeByName,
  getEquidistantColors,
  getNodeColor,
  getVisibleNodes,
  isLargeEnoughForLabel,
  layoutRelativeTo,
} from "./utils";

const ATTR = {
  TRANSFORM: "transform",
} as const;

const STYLE = {
  POINTER_EVENTS: "pointer-events",
  STROKE_WIDTH: "stroke-width",
} as const;

const REVERSED_ROMA_CYCLIC = [...roma_cyclic].reverse();

export type SunburstChartProps = {
  data: TaxonomyNode;
  depth: number;
  logoPath: string;
  startingNode: string;
};

export const SunburstChart = ({
  data,
  depth: DEPTH,
  logoPath: LOGO_PATH,
  startingNode,
}: SunburstChartProps): JSX.Element => {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [rootNode, setRootNode] = useState<TreeNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Add a reference to the clicked function so it can be called from NodeDetails
  const clickedRef = useRef<(p: TreeNode) => void>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svgNode = svgRef.current;
    select(svgNode).selectAll("*").remove();

    const width = 800;
    const radius = (width - 10) / 2;

    const svg = select(svgNode)
      .attr("viewBox", [-width / 2, -width / 2, width, width].join(" "))
      .style("font", "10px 'Inter Tight', sans-serif");

    const tooltip = select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("text-align", "center")
      .style("padding", "6px")
      .style("font", "12px 'Inter Tight', sans-serif")
      .style("background", PALETTE.SMOKE_LIGHTEST)
      .style("border", "0px")
      .style("border-radius", "8px")
      .style(STYLE.POINTER_EVENTS, "none");

    const hierarchyData = hierarchy<TaxonomyNode>(data)
      .sum((d) => (d.children.length == 0 ? 1 : 0))
      .sort((a, b) => (a.data.name < b.data.name ? -1 : 1));
    const root = partition<TaxonomyNode>().size([
      2 * Math.PI,
      hierarchyData.height + 1,
    ])(hierarchyData) as TreeNode;
    const nodeKeys = new Map<TreeNode, string>();
    root.each((d, i) => nodeKeys.set(d as TreeNode, String(i)));
    const keyOf = (d: TreeNode): string => nodeKeys.get(d) ?? "";
    setRootNode(root);

    const arc = d3Arc<ArcCoords>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius)
      .innerRadius((d) => (Math.min(d.y0, DEPTH) * radius) / DEPTH)
      .outerRadius((d) => (Math.min(d.y1, DEPTH) * radius) / DEPTH - 0.5);

    // First-tier labels get pushed out a little so they don't crowd the
    // center label.
    function labelTransform(
      d: TreeNode,
      coords: ArcCoords,
      center: TreeNode
    ): string {
      const angle = ((coords.x0 + coords.x1) / 2) * (180 / Math.PI);
      let r =
        ((Math.min(coords.y0, DEPTH) + Math.min(coords.y1, DEPTH)) / 2) *
        (radius / DEPTH);
      if (d.parent === center) r += 10;
      return `rotate(${angle - 90}) translate(${r},0) rotate(${angle < 180 ? 0 : 180})`;
    }

    const arcLayer = svg.append("g");
    const labelLayer = svg
      .append("g")
      .attr(STYLE.POINTER_EVENTS, "none")
      .attr("text-anchor", "middle");

    const centerGroup = svg
      .append("g")
      .attr("class", "center-group")
      .style(STYLE.POINTER_EVENTS, "none");
    const LOGO_SIZE = 140;
    const logoImage = centerGroup
      .append("image")
      .attr("x", -LOGO_SIZE / 2)
      .attr("y", -LOGO_SIZE / 2)
      .attr("width", LOGO_SIZE)
      .attr("height", LOGO_SIZE)
      .attr("href", LOGO_PATH)
      .attr("preserveAspectRatio", "xMidYMid meet");
    const centerText = centerGroup
      .append("text")
      .attr("class", "center-label")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "16px")
      .style("opacity", 0);

    let currentRoot = root;

    // Invisible center circle doubles as the zoom-out button.
    svg
      .append("circle")
      .attr("r", radius / DEPTH)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("click", () => {
        if (currentRoot.parent) zoomTo(currentRoot.parent as TreeNode);
      });

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
      const childColors = getEquidistantColors(
        REVERSED_ROMA_CYCLIC,
        center.children?.length ?? 0
      );
      const colorOf = (d: TreeNode): string =>
        getNodeColor(d, center, childColors);

      const path = arcLayer
        .selectAll<SVGPathElement, TreeNode>("path")
        .data(nodes, keyOf)
        .join((enter) =>
          enter
            .append("path")
            .attr("d", (d) => arc(d.current))
            .style("cursor", "pointer")
            .style("stroke", "#333")
            .style(STYLE.STROKE_WIDTH, "1px")
            .on("mouseover", function (event: MouseEvent, d) {
              select(this).style(STYLE.STROKE_WIDTH, "2px");
              tooltip.transition().duration(200).style("opacity", 0.9);
              tooltip
                .html("")
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 28 + "px")
                .append("strong")
                .text(d.data.name);
            })
            .on("mouseout", function () {
              select(this).style(STYLE.STROKE_WIDTH, "1px");
              tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", (_event, d) => zoomTo(d))
        );
      // Leaving arcs keep their colour; they have no place under the new
      // center to take one from.
      path
        .filter((d) => nextSet.has(d) && (!animate || !rendered.has(d)))
        .attr("fill", colorOf);

      const labelNodes = next.filter(
        (d) => d.parent !== null && isLargeEnoughForLabel(d.target)
      );
      const label = labelLayer
        .selectAll<SVGTextElement, TreeNode>("text")
        .data(labelNodes, keyOf)
        .join((enter) =>
          enter
            .append("text")
            .attr("dy", "0.35em")
            .text((d) => d.data.name)
        );

      const finish = (d: TreeNode): void => {
        d.current = d.target;
      };
      // Snapshot start positions: the path tweens rewrite d.current as they
      // run, and the label tweens must start from the same place.
      const from = new Map(nodes.map((d) => [d, d.current]));
      if (!animate) {
        path.attr("d", (d) => arc(d.target)).each(finish);
        path.filter((d) => !nextSet.has(d)).remove();
        label.attr(ATTR.TRANSFORM, (d) => labelTransform(d, d.target, center));
        return;
      }
      path
        .filter((d) => nextSet.has(d) && rendered.has(d))
        .transition("fill")
        .duration(750)
        .attr("fill", colorOf);
      path
        .transition()
        .duration(750)
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
      label
        .transition()
        .duration(750)
        .attrTween(ATTR.TRANSFORM, (d) => {
          const i = interpolate(from.get(d) ?? d.current, d.target);
          return (t: number): string => labelTransform(d, i(t), center);
        });
    }

    function updateCenter(p: TreeNode): void {
      const isRoot = p.depth === 0;
      logoImage.style("opacity", isRoot ? 1 : 0);
      centerText
        .style("opacity", isRoot ? 0 : 1)
        .text(isRoot ? "" : p.data.name);
    }

    function zoomTo(p: TreeNode, animate = true): void {
      updateCenter(p);
      setSelectedNode(p);
      render(p, animate);
    }

    clickedRef.current = zoomTo;
    zoomTo(root, false);
    const start = findNodeByName(root, startingNode);
    if (start !== root) zoomTo(start);

    return (): void => {
      tooltip.remove();
      select(svgNode).selectAll("*").interrupt().remove();
    };
  }, [data, DEPTH, LOGO_PATH, startingNode]);

  const handleNodeClick = (node: TreeNode): void => {
    clickedRef.current?.(node);
  };

  return (
    <div
      style={{
        display: "flex",
        margin: "0 auto",
        maxWidth: "1136px",
        position: "relative",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", width: "70%" }}>
        <svg ref={svgRef} style={{ maxWidth: "800px", width: "100%" }}></svg>
      </div>
      <div style={{ marginLeft: "3rem", padding: "1rem", width: "30%" }}>
        {selectedNode ? (
          <NodeDetails
            node={selectedNode}
            onClose={() => rootNode && clickedRef.current?.(rootNode)}
            onNodeClick={handleNodeClick}
          />
        ) : (
          <p>No node selected</p>
        )}
      </div>
    </div>
  );
};

export default SunburstChart;
