import * as d3 from "d3";
import { useRef, useEffect, useState } from "react";
import { getData, TaxonomyNode } from "./data";
import { TreeNode, NodeDetails } from "./NodeDetails";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

const DEPTH = 4;
const data = getData();

export const SectionViz = (): JSX.Element => {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [rootNode, setRootNode] = useState<TreeNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Add a reference to the clicked function so it can be called from NodeDetails
  const clickedRef =
    useRef<(event: React.MouseEvent | null, p: TreeNode) => void>();

  useEffect(() => {
    if (!svgRef.current) return;

    // Store a reference to the current DOM node
    const svgNode = svgRef.current;

    // Clear any existing content in case of re-render
    d3.select(svgNode).selectAll("*").remove();

    // Set up dimensions and radius for the sunburst chart
    const width = 800;
    const height = width;
    const radius = (width - 10) / 2;

    // Create the main SVG container and center the group
    const svg = d3
      .select(svgNode)
      .attr("viewBox", [-width / 2, -height / 2, width, width])
      .style("font", "10px 'Inter Tight', sans-serif");
    // Define a color scale for base colors (root and first ring)
    const baseColor = d3.scaleOrdinal(d3.schemeTableau10);

    // Helper function to get color for a node based on the current root
    function getNodeColor(d: TreeNode, root: TreeNode): string {
      // Adjust depth relative to current root
      const relativeDepth = d.depth - root.depth;

      if (relativeDepth === 0) {
        // Keep center node color consistent, background-light
        return PALETTE.SMOKE_LIGHTEST;
      } else if (relativeDepth === 1) {
        // Direct children of root get base colors
        return baseColor(d.data.name);
      }

      // For descendants, get the color of their direct child of the root ancestor and modify it
      const rootChild = findRootChild(d, root);
      if (!rootChild) return "#ccc"; // fallback

      const baseColorHsl = d3.hsl(baseColor(rootChild.data.name));

      // Increase lightness and decrease saturation as we go deeper
      const lightnessFactor = 0.05 * (relativeDepth - 1);
      const saturationFactor = 0.1 * (relativeDepth - 1);

      return d3
        .hsl(
          baseColorHsl.h,
          Math.max(0, baseColorHsl.s - saturationFactor),
          Math.min(1, baseColorHsl.l + lightnessFactor)
        )
        .toString();
    }

    // Helper function to find the ancestor that is a direct child of the current root
    function findRootChild(node: TreeNode, root: TreeNode): TreeNode | null {
      if (node === root) return null;

      const ancestors = node.ancestors();
      // Find the ancestor that is a direct child of root
      for (let i = 0; i < ancestors.length; i++) {
        if (ancestors[i].parent === root) {
          // Return the first ancestor that is a direct child of root
          return ancestors[i];
        }
      }
      return null;
    }

    // Create a tooltip for interactivity
    const tooltip = d3
      .select("body")
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
      .style("pointer-events", "none");

    // Create a hierarchy from the sample data.
    const hierarchyData = d3
      .hierarchy<TaxonomyNode>(data)
      .sum((d) => (d.children.length == 0 ? 1 : 0))
      .sort((a, b) => (a.data.name < b.data.name ? -1 : 1));

    // Create the partition layout and initialize the TreeNode properties
    const rootNode = d3
      .partition<TaxonomyNode>()
      .size([2 * Math.PI, hierarchyData.height + 1])(hierarchyData);

    // Initialize the custom properties needed for D3 transitions
    const root = rootNode as unknown as TreeNode;
    root.each((d) => {
      // Need to use type assertion to add custom properties to d3 nodes
      const node = d as unknown as TreeNode;

      // Initialize current and target with the node's own coordinates
      node.current = {
        x0: d.x0,
        x1: d.x1,
        y0: d.y0,
        y1: d.y1,
      };
      node.target = {
        x0: d.x0,
        x1: d.x1,
        y0: d.y0,
        y1: d.y1,
      };
    });

    // Save the root node to state
    setRootNode(root);

    // Save each node's initial coordinates for smooth transitions.
    root.each((d) => (d.current = d));

    // Global variable to track the current center (zoomed) node. Initially, it's the root.
    let currentRoot = root;
    setSelectedNode(currentRoot);

    // An arc generator that "clamps" the radial depth so that
    // only the center plus DEPTH levels are visible.
    const arc = d3
      .arc<{ x0: number; x1: number; y0: number; y1: number }>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius)
      .innerRadius((d) => (Math.min(d.y0, DEPTH) * radius) / DEPTH)
      .outerRadius((d) => (Math.min(d.y1, DEPTH) * radius) / DEPTH - 0.5);

    function isVisible(
      d: TreeNode,
      currentRoot: TreeNode,
      targetDepth: number
    ): boolean {
      const isDescendant = d.ancestors().indexOf(currentRoot) >= 0;
      const withinDepth = d.depth - targetDepth <= DEPTH - 1;
      return isDescendant && withinDepth;
    }

    // Function to check if an arc is large enough to display a label (at least 1% of the circle)
    function isLargeEnoughForLabel(d: TreeNode): boolean {
      // Calculate the angular size of the arc as a percentage of the full circle
      const arcSizePercentage =
        ((d.current.x1 - d.current.x0) / (2 * Math.PI)) * 100;
      return arcSizePercentage >= 1; // Only show labels for arcs that are at least 1% of the circle
    }

    // Consolidated function to check if a label should be visible
    function isLabelVisible(
      d: TreeNode,
      currentRoot: TreeNode,
      targetDepth: number
    ): boolean {
      // Labels should not be visible for the current root node
      if (d === currentRoot) {
        return false;
      }

      // Labels should only be visible if the node is visible and large enough
      return isVisible(d, currentRoot, targetDepth) && isLargeEnoughForLabel(d);
    }

    // Draw the sunburst segments (we still don't draw the center node as an arc)
    const path = svg
      .append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
      .attr("fill", (d) => getNodeColor(d, root))
      // Show only nodes with relative depth <= DEPTH.
      .attr("fill-opacity", (d) => (isVisible(d, root, 0) ? 1 : 0))
      .attr("stroke-opacity", (d) => (isVisible(d, root, 0) ? 1 : 0))
      .attr("d", (d) => arc(d.current))
      .style("cursor", "pointer")
      .style("stroke", "#333")
      .style("stroke-width", "1px")
      .on("mouseover", function (event, d) {
        // Hghlight the arc, and display the node name and value in the tooltip.
        d3.select(this).style("stroke-width", "2px");
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`<strong>${d.data.name}</strong>`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        // Restore the original stroke color and width
        d3.select(this).style("stroke-width", "1px");
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .on("click", clicked);

    /* 
      Helper function to compute label transform.
      Note: For first‑tier nodes (where d.parent === currentRoot) we add an offset
      so the label doesn't crowd the center label.
    */
    function labelTransform(d: TreeNode): string {
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
        // Use the consolidated visibility function for consistent behavior
        return isLabelVisible(d, root, 0) ? 1 : 0;
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

    function updateCenter(p: TreeNode): void {
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

    // Helper function that returns a tween function for fill opacity
    function createOpacityTween(
      d: TreeNode,
      currentRoot: TreeNode,
      targetDepth: number
    ) {
      return (): string =>
        isLabelVisible(d, currentRoot, targetDepth) ? "1" : "0";
    }

    function clicked(event: React.MouseEvent | null, p: TreeNode): void {
      // Update the current center and the center label.
      currentRoot = p;
      updateCenter(p);
      setSelectedNode(p);

      // For each node, compute new coordinates relative to p.
      root.each((d) => {
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

      // Transition the arcs.
      path
        .transition()
        .duration(750)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          // eslint-disable-next-line sonarjs/no-nested-functions -- cleaner in d3 to keep this inlined
          return (transition_duration: number): void => {
            d.current = i(transition_duration);
          };
        })
        // eslint-disable-next-line sonarjs/no-nested-functions -- cleaner in d3 to keep this inlined
        .attrTween("d", (d) => (): string => arc(d.current) || "")
        .attr("fill", (d) => getNodeColor(d, p)) // Update colors based on new root
        .attr("fill-opacity", (d): number =>
          isVisible(d, currentRoot, p.depth) ? 1 : 0
        )
        .attr("stroke-opacity", (d) =>
          isVisible(d, currentRoot, p.depth) ? 1 : 0
        );

      // Transition the labels with updated visibility logic
      label
        .transition()
        .duration(750)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          // eslint-disable-next-line sonarjs/no-nested-functions -- cleaner in d3 to keep this inlined
          return (transition_duration: number): void => {
            d.current = i(transition_duration);
          };
        })
        .attrTween(
          "transform",
          // eslint-disable-next-line sonarjs/no-nested-functions -- cleaner in d3 to keep this inlined
          (d) => (): string => labelTransform(d)
        )
        .attrTween("fill-opacity", (d) =>
          createOpacityTween(d, currentRoot, p.depth)
        );
    }

    // Assign the clicked function to the ref so it can be accessed outside
    clickedRef.current = clicked;

    // Clean up on component unmount: remove tooltip and clear svg.
    return (): void => {
      tooltip.remove();
      d3.select(svgNode).selectAll("*").remove();
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
      <div style={{ marginLeft: "3rem", padding: "1rem", width: "30%" }}>
        {selectedNode ? (
          <NodeDetails
            node={selectedNode}
            onClose={() =>
              rootNode &&
              clickedRef.current &&
              clickedRef.current(null, rootNode)
            }
            onNodeClick={handleNodeClick}
          />
        ) : (
          <p>No node selected</p>
        )}
      </div>
    </div>
  );
};
