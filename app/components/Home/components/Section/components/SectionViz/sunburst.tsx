import {
  select,
  scaleOrdinal,
  schemeTableau10,
  hsl,
  hierarchy,
  partition,
  arc as d3Arc,
  interpolate,
  HierarchyNode,
} from "d3";
import { useRef, useEffect, useState } from "react";
import { getData } from "./data";
import { TreeNode, NodeDetails } from "./NodeDetails";

const DEPTH = 4;
const data = getData();

export const SectionViz = (): JSX.Element => {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Add a reference to the clicked function so it can be called from NodeDetails
  const clickedRef =
    useRef<(event: React.MouseEvent | null, p: TreeNode) => void>();

  useEffect(() => {
    if (!svgRef.current) return;

    // Store a reference to the current DOM node
    const svgNode = svgRef.current;

    // Clear any existing content in case of re-render
    select(svgNode).selectAll("*").remove();

    // Set up dimensions and radius for the sunburst chart
    const width = 800;
    const height = width;
    const radius = (width - 10) / 2;

    // Create the main SVG container and center the group
    const svg = select(svgNode)
      .attr("viewBox", [-width / 2, -height / 2, width, width])
      .style("font", "10px sans-serif");
    // Define a color scale for base colors (root and first ring)
    const baseColor = scaleOrdinal(schemeTableau10);

    // Helper function to get color for a node
    function getNodeColor(d): string {
      if (d.depth === 0) return baseColor(d.data.name); // root
      if (d.depth === 1) return baseColor(d.data.name); // first ring

      // For descendants, get the color of their depth=1 ancestor and modify it
      const ancestor = d.ancestors().find((n) => n.depth === 1);
      if (!ancestor) return "#ccc"; // fallback

      const baseColorHsl = hsl(baseColor(ancestor.data.name));

      // Increase lightness and decrease saturation as we go deeper
      const lightnessFactor = 0.05 * (d.depth - 1);
      const saturationFactor = 0.1 * (d.depth - 1);

      return hsl(
        baseColorHsl.h,
        Math.max(0, baseColorHsl.s - saturationFactor),
        Math.min(1, baseColorHsl.l + lightnessFactor)
      ).toString();
    }

    // Create a tooltip for interactivity
    const tooltip = select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("text-align", "center")
      .style("padding", "6px")
      .style("font", "12px sans-serif")
      .style("background", "lightsteelblue")
      .style("border", "0px")
      .style("border-radius", "8px")
      .style("pointer-events", "none");

    // Create a hierarchy from the sample data.
    const hierarchyData = hierarchy(data)
      .sum((d) => (d.children.length == 0 ? 1 : 0))
      .sort((a: unknown, b: unknown) => (a.data.name < b.data.name ? -1 : 1));

    const root = partition().size([2 * Math.PI, hierarchyData.height + 1])(
      hierarchyData
    );

    root.each((d) => (d.current = d));

    // Create a partition layout (compute the full layout even though we display only DEPTH layers)
    partition().size([2 * Math.PI, root.height + 1])(root);

    // Save each node’s initial coordinates for smooth transitions.
    root.each((d) => (d.current = d));

    // Global variable to track the current center (zoomed) node. Initially, it’s the root.
    let currentRoot = root;
    setSelectedNode(currentRoot);

    // An arc generator that “clamps” the radial depth so that
    // only the center plus DEPTH levels are visible.
    const arc = d3Arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius)
      .innerRadius((d) => (Math.min(d.y0, DEPTH) * radius) / DEPTH)
      .outerRadius((d) => (Math.min(d.y1, DEPTH) * radius) / DEPTH - 0.5);

    function isVisible(
      d: HierarchyNode<TreeNode>,
      currentRoot: HierarchyNode<TreeNode>,
      targetDepth: number
    ): boolean {
      const isDescendant = d.ancestors().indexOf(currentRoot) >= 0;
      const withinDepth = d.depth - targetDepth <= DEPTH - 1;
      return isDescendant && withinDepth;
    }

    // Draw the sunburst segments (we still don’t draw the center node as an arc)
    const path = svg
      .append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
      .attr("fill", (d) => getNodeColor(d))
      // Show only nodes with relative depth <= DEPTH.
      .attr("fill-opacity", (d) => (isVisible(d, root, 0) ? 1 : 0))
      .attr("stroke-opacity", (d) => (isVisible(d, root, 0) ? 1 : 0))
      .attr("d", (d) => arc(d.current))
      .style("cursor", "pointer")
      .style("stroke", "#333")
      .style("stroke-width", "1px")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`<strong>${d.data.name}</strong><br/>Assemblies: ${d.value}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .on("click", clicked);

    /* 
      Helper function to compute label transform.
      Note: For first‑tier nodes (where d.parent === currentRoot) we add an offset
      so the label doesn’t crowd the center label.
    */
    function labelTransform(d): string {
      const angle = ((d.current.x0 + d.current.x1) / 2) * (180 / Math.PI);
      let r =
        ((Math.min(d.current.y0, DEPTH) + Math.min(d.current.y1, DEPTH)) / 2) *
        (radius / DEPTH);
      if (d.parent === currentRoot) {
        r += 10; // extra offset for first-tier nodes
      }
      return `rotate(${angle - 90}) translate(${r},0) rotate(${angle < 180 ? 0 : 180})`;
    }

    // Add labels for arcs (excluding the center node)
    // We hide the label for the current center node (using centerLabel instead).
    const label = svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
      .attr("fill-opacity", (d) => {
        // If this node is the current root, make it invisible
        if (d === currentRoot) {
          return 0;
        }
        // Otherwise, check if it's visible in the current view
        if (isVisible(d, root, 0)) {
          return 1;
        } else {
          return 0;
        }
      })
      .attr("dy", "0.35em")
      .attr("transform", labelTransform)
      .text((d) => d.data.name);

    const centerGroup = svg
      .append("g")
      .attr("class", "center-group")
      .style("pointer-events", "none");

    const LOGO_WIDTH = 140;
    const LOGO_HEIGHT = 140;

    // Add foreignObject for logo
    const logoObject = centerGroup
      .append("foreignObject")
      .attr("x", -LOGO_WIDTH / 2)
      .attr("y", -LOGO_HEIGHT / 2)
      .attr("width", LOGO_WIDTH)
      .attr("height", LOGO_HEIGHT)
      .style("opacity", 1);

    logoObject
      .append("xhtml:img")
      .attr("src", "/logo/brc.svg")
      .attr("width", LOGO_WIDTH)
      .attr("height", LOGO_HEIGHT)
      .style("object-fit", "contain");

    // Add text element for non-root nodes
    const centerText = centerGroup
      .append("text")
      .attr("class", "center-label")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "16px")
      .style("opacity", 0);

    function updateCenter(p): void {
      const isRoot = p.depth === 0;
      logoObject.style("opacity", isRoot ? 1 : 0);
      centerText
        .style("opacity", isRoot ? 0 : 1)
        .text(isRoot ? "" : p.data.name);
    }

    // Add an invisible center circle to act as a zoom-out button.
    svg
      .append("circle")
      .attr("r", radius / DEPTH)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("click", function (event) {
        if (currentRoot && currentRoot.parent) {
          clicked(event, currentRoot.parent);
        }
      });

    // Zoom handler: when a node is clicked, re-root the chart at that node and
    // display up to DEPTH layers (i.e. its children, grandchildren, and great-grandchildren).
    // Define interfaces for the target and transition data
    interface NodeTarget {
      x0: number;
      x1: number;
      y0: number;
      y1: number;
    }

    function clicked(
      event: React.MouseEvent | null,
      p: HierarchyNode<TreeNode>
    ): void {
      // Update the current center and the center label.
      currentRoot = p;
      updateCenter(p);
      setSelectedNode(p);
      console.debug(p);

      // For each node, compute new coordinates relative to p.
      root.each((d: TreeNode) => {
        d.target = {
          x0:
            Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
            2 *
            Math.PI,
          x1:
            Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
            2 *
            Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth),
        } as NodeTarget;
      });

      const transition = svg.transition().duration(750);

      // Transition the arcs.
      path
        .transition(transition)
        .tween("data", (d: TreeNode) => {
          const i = interpolate(d.current, d.target);
          // eslint-disable-next-line sonarjs/no-nested-functions -- cleaner in d3 to keep this inlined
          return (transition_duration: number): void => {
            d.current = i(transition_duration);
          };
        })
        // eslint-disable-next-line sonarjs/no-nested-functions -- cleaner in d3 to keep this inlined
        .attrTween("d", (d: TreeNode) => (): string => arc(d.current))
        .attr("fill-opacity", (d: TreeNode): number =>
          isVisible(d, currentRoot, p.depth) ? 1 : 0
        )
        .attr("stroke-opacity", (d: TreeNode) =>
          isVisible(d, currentRoot, p.depth) ? 1 : 0
        );

      // Transition the labels with updated visibility logic
      label
        .transition(svg.transition().duration(750))
        .tween("data", (d) => {
          const i = interpolate(d.current, d.target);
          // eslint-disable-next-line sonarjs/no-nested-functions -- cleaner in d3 to keep this inlined
          return (transition: number): void => {
            d.current = i(transition);
          };
        })
        .attrTween(
          "transform",
          // eslint-disable-next-line sonarjs/no-nested-functions -- cleaner in d3 to keep this inlined
          (d) => (): string => labelTransform(d)
        )
        .attr("fill-opacity", (d) => {
          // If this node is the current root, make it invisible
          if (d === currentRoot) {
            return 0;
          }

          // Otherwise, check if it's visible based on the current depth
          if (isVisible(d, currentRoot, p.depth)) {
            return 1; // Visible node
          } else {
            return 0; // Hidden node
          }
        });
    }

    // Assign the clicked function to the ref so it can be accessed outside
    clickedRef.current = clicked;

    // Clean up on component unmount: remove tooltip and clear svg.
    return (): void => {
      tooltip.remove();
      select(svgNode).selectAll("*").remove();
    };
  }, []);

  // Handler for when a node is clicked in the NodeDetails component
  const handleNodeClick = (node: TreeNode): void => {
    if (clickedRef.current) {
      clickedRef.current(null, node);
    }
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
        <svg ref={svgRef}></svg>
      </div>
      <div style={{ padding: "1rem", width: "30%" }}>
        {selectedNode ? (
          <NodeDetails
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onNodeClick={handleNodeClick}
          />
        ) : (
          <p>No node selected</p>
        )}
      </div>
    </div>
  );
};
