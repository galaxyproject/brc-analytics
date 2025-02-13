import * as d3 from "d3";
import { useRef, useEffect, useState } from "react";
import { data } from "./data";
import { NodeDetails } from "./NodeDetails";

export const SectionViz = (): JSX.Element => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing content in case of re-render
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions for the icicle chart.
    const width = 800;
    const height = 1200;

    // Create the color scale.
    const color = d3.scaleOrdinal(
      d3.quantize(d3.interpolateRainbow, data.children.length + 1)
    );

    // Compute the hierarchy using the "size" property.
    const hierarchyData = d3
      .hierarchy(data)
      .sum((d: any) => d.size || 0)
      .sort((a, b) => b.height - a.height || b.value - a.value);

    const root = d3
      .partition()
      .size([height, (hierarchyData.height + 1) * (width / 3)])(hierarchyData);

    // Variable to track the current focus.
    let focus = root;

    // Select the SVG container and set attributes.
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height] as any)
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // Append a group for each node.
    const cell = svg
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.y0},${d.x0})`);

    // Append rectangles for each node.
    const rect = cell
      .append("rect")
      .attr("width", (d) => d.y1 - d.y0 - 1)
      .attr("height", (d) => rectHeight(d))
      .attr("fill-opacity", 0.6)
      .attr("fill", (d) => {
        if (!d.depth) return "#ccc";
        let current = d;
        while (current.depth > 1) current = current.parent;
        return color(current.data.name);
      })
      .style("cursor", "pointer")
      .on("click", clicked);

    // Append text labels.
    const text = cell
      .append("text")
      .style("user-select", "none")
      .attr("pointer-events", "none")
      .attr("x", 4)
      .attr("y", 13)
      .attr("fill-opacity", (d) => +labelVisible(d));

    text.append("tspan").text((d) => d.data.name);

    const format = d3.format(",d");
    const tspan = text
      .append("tspan")
      .attr("fill-opacity", (d) => labelVisible(d) * 0.7)
      .text((d) => ` ${format(d.value)}`);

    // Add a tooltip with the full name and value.
    cell.append("title").text(
      (d) =>
        `${d
          .ancestors()
          .map((d) => d.data.name)
          .reverse()
          .join("/")}\n${format(d.value)}`
    );

    function clicked(event: any, p: any) {
      // Determine the new focus:
      // If p is already the focus and has a parent, then zoom out (newFocus = p.parent).
      // Otherwise, zoom in (newFocus = p).
      const newFocus = focus === p && p.parent ? p.parent : p;

      // Update the selected node state.
      setSelectedNode(newFocus);

      // Update the current focus.
      focus = newFocus;

      // Recalculate new positions for each node.
      root.each((d) => {
        d.target = {
          x0: ((d.x0 - newFocus.x0) / (newFocus.x1 - newFocus.x0)) * height,
          x1: ((d.x1 - newFocus.x0) / (newFocus.x1 - newFocus.x0)) * height,
          y0: d.y0 - newFocus.y0,
          y1: d.y1 - newFocus.y0,
        };
      });

      // Transition cells to their new positions.
      const t = cell
        .transition()
        .duration(750)
        .attr("transform", (d) => `translate(${d.target.y0},${d.target.x0})`);

      rect.transition(t).attr("height", (d) => rectHeight(d.target));
      text.transition(t).attr("fill-opacity", (d) => +labelVisible(d.target));
      tspan
        .transition(t)
        .attr("fill-opacity", (d) => labelVisible(d.target) * 0.7);
    }

    // Helper function to compute rectangle height.
    function rectHeight(d: any) {
      return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
    }

    // Helper function to determine if a label is visible.
    function labelVisible(d: any) {
      // Always show labels for nodes whose parent is the current focus.
      // (These nodes appear in the second column relative to the current view.)
      if (d.parent === focus) return 1;
      // Otherwise, apply the default condition.
      return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 10 ? 1 : 0;
    }

    // Clean up on component unmount.
    return () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, []); // Run once on mount

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        maxWidth: "1136px",
        margin: "0 auto",
      }}
    >
      <div style={{ width: "70%", display: "flex", justifyContent: "center" }}>
        <svg ref={svgRef}></svg>
      </div>
      <div style={{ width: "30%", padding: "1rem" }}>
        {selectedNode ? (
          <NodeDetails node={selectedNode} />
        ) : (
          <p>No node selected</p>
        )}
      </div>
    </div>
  );
};
