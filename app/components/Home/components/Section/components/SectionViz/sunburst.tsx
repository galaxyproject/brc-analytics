import { 
  select, 
  scaleOrdinal, 
  schemeTableau10, 
  hsl, 
  hierarchy, 
  partition, 
  arc as d3Arc,
  interpolate,
  transition as d3Transition
} from "d3";
import { useRef, useEffect, useState } from "react";
import { getData } from "./data";
import { TreeNode, NodeDetails } from "./NodeDetails";
import { cyclic_roma_vibrant as colorScheme } from "../../../../../../../color-maps/crameri";

const DEPTH = 4;
const data = getData();

export const SectionViz = (): JSX.Element => {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing content in case of re-render
    select(svgRef.current).selectAll("*").remove();

    // Set up dimensions and radius for the sunburst chart
    const width = 800;
    const height = width;
    const radius = (width - 10) / 2;

    // Create the main SVG container and center the group
    const svg = select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, width])
      .style("font", "10px sans-serif");

    // Function to get equidistant colors from the palette
    function getEquidistantColors(palette, count) {
      const result = [];
      
      // If we need just one color, return a color 25% of the way along the palette
      if (count === 1) {
        const quarterIndex = Math.floor(palette.length * 0.25);
        return [palette[quarterIndex]];
      }
      
      // Trim 5% from each end of the palette
      // these colors in continuous palettes tend to be very dark or very light
      const trimPercentage = 0.05;
      const trimAmount = Math.floor(palette.length * trimPercentage);
      const trimmedPalette = palette.slice(trimAmount, palette.length - trimAmount);
      
      // Calculate step size to get equidistant colors from the trimmed palette
      const step = (trimmedPalette.length - 1) / (count - 1);
      
      for (let i = 0; i < count; i++) {
        const index = Math.min(Math.round(i * step), trimmedPalette.length - 1);
        result.push(trimmedPalette[index]);
      }
      
      return result;
    }

    // Function to create a color mapping for a given root node
    function createColorMapping(rootNode) {
      // Get the unique first-level children to determine how many colors we need
      const firstLevelChildren = rootNode.children ? rootNode.children.map(child => child.data.name) : [];
      const uniqueFirstLevelNames = [...new Set(firstLevelChildren)];
      
      // Reverse the color scheme before getting equidistant colors
      // this just for aesthetics w the particular color scheme were using
      const reversedColorScheme = [...colorScheme].reverse();
      
      // Get equidistant colors from the reversed palette
      const discreteColors = getEquidistantColors(reversedColorScheme, uniqueFirstLevelNames.length);
      
      // Create a color mapping for first-level children
      const mapping = {};
      uniqueFirstLevelNames.forEach((name, index) => {
        mapping[name] = discreteColors[index];
      });
      
      return mapping;
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
      .sort((a: any, b: any) => (b.data.name < b.data.name ? -1 : 1));

    const root = partition().size([2 * Math.PI, hierarchyData.height + 1])(
      hierarchyData
    );

    root.each((d) => (d.current = d));

    // Create initial color mapping
    let colorMap = createColorMapping(root);

    // Define a color scale for base colors (root and first ring)
    const baseColor = (name, currentRoot) => {
      // If we have a new root, we need to update the color mapping
      if (currentRoot !== root && currentRoot.colorMap === undefined) {
        currentRoot.colorMap = createColorMapping(currentRoot);
      }
      
      // Use the appropriate color map
      const map = (currentRoot !== root && currentRoot.colorMap) ? currentRoot.colorMap : colorMap;
      return map[name] || "#ccc"; // Fallback to gray if name not found
    };

    // Helper function to get color for a node based on the current root
    function getNodeColor(d, currentRoot): string {
      // Adjust depth relative to current root
      const relativeDepth = d.depth - currentRoot.depth;
      
      if (relativeDepth === 0) return "#555"; // Current root is dark gray
      if (relativeDepth === 1) return baseColor(d.data.name, currentRoot); // Direct children of root get discrete colors
      
      // For descendants, get the color of their direct child of the root ancestor and modify it
      const rootChild = findRootChild(d, currentRoot);
      if (!rootChild) return "#ccc"; // fallback
      
      const baseColorHsl = hsl(baseColor(rootChild.data.name, currentRoot));
      
      // Increase lightness and decrease saturation as we go deeper
      const lightnessFactor = 0.05 * (relativeDepth - 1);
      const saturationFactor = 0.1 * (relativeDepth - 1);
      
      return hsl(
        baseColorHsl.h,
        Math.max(0, baseColorHsl.s - saturationFactor),
        Math.min(1, baseColorHsl.l + lightnessFactor)
      ).toString();
    }
    
    // Helper function to find the ancestor that is a direct child of the current root
    function findRootChild(node, root) {
      if (node === root) return null;
      
      const ancestors = node.ancestors();
      // Find the ancestor that is a direct child of root
      for (let i = 0; i < ancestors.length; i++) {
        if (ancestors[i].parent === root) {
          return ancestors[i];
        }
      }
      return null;
    }

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

    function isVisible(d, currentRoot, targetDepth) {
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
      .attr("fill", (d) => getNodeColor(d, root))
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
    function labelTransform(d) {
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
      .attr("fill-opacity", (d) =>
        d === currentRoot ? 0 : isVisible(d, root, 0) ? 1 : 0
      )
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

    function updateCenter(p) {
      const isRoot = p.depth === 0;
      logoObject.style("opacity", isRoot ? 1 : 0);
      centerText
        .style("opacity", isRoot ? 0 : 1)
        .text(isRoot ? "" : p.data.name);
    }

    // Add an invisible center circle to act as a zoom-out button.
    const center = svg
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
    function clicked(event, p) {
      // Don't zoom if we're clicking on the current root
      if (p === currentRoot) return;

      // Update the current root reference
      currentRoot = p;
      updateCenter(p);
      setSelectedNode(p);
      console.debug(p);

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
        };
      });

      const transition = svg.transition().duration(750);

      // Transition the arcs.
      path
        .transition(transition)
        .tween("data", (d) => {
          const i = interpolate(d.current, d.target);
          return (transition_duration) => {
            d.current = i(transition_duration);
          };
        })
        .attrTween("d", (d) => () => arc(d.current))
        .attr("fill", (d) => getNodeColor(d, p)) // Update colors based on new root
        .attr("fill-opacity", (d) =>
          isVisible(d, currentRoot, p.depth) ? 1 : 0
        )
        .attr("stroke-opacity", (d) =>
          isVisible(d, currentRoot, p.depth) ? 1 : 0
        );

      // Transition the labels with updated visibility logic
      label
        .transition(transition)
        .tween("data", (d) => {
          const i = interpolate(d.current, d.target);
          return (transition) => {
            d.current = i(transition);
          };
        })
        .attrTween("transform", (d) => () => labelTransform(d))
        .attr("fill-opacity", (d) =>
          d === currentRoot ? 0 : isVisible(d, currentRoot, p.depth) ? 1 : 0
        );
    }

    // Clean up on component unmount: remove tooltip and clear svg.
    return () => {
      tooltip.remove();
      select(svgRef.current).selectAll("*").remove();
    };
  }, []);

  return (
    /* <!-- todo: use standard section layouts... --> */
    <div
      style={{
        display: "flex",
        margin: "0 auto",
        maxWidth: "1136px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", width: "70%" }}>
        <svg ref={svgRef}></svg>
      </div>
      <div style={{ padding: "1rem", width: "30%" }}>
        {selectedNode ? (
          <NodeDetails node={selectedNode} />
        ) : (
          <p>No node selected</p>
        )}
      </div>
    </div>
  );
};
