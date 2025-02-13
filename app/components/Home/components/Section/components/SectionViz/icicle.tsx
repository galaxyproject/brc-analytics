import * as d3 from "d3";
import { useRef, useEffect, useState } from "react";
import { getData } from "./data";
import { NodeDetails } from "./NodeDetails";

const data = getData();

export const SectionViz = (): JSX.Element => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    // Adjust dimensions to better handle deep hierarchies
    const width = 1000;
    const height = 600;

    // Create a sequential color scale that works well with taxonomy levels
    const color = d3.scaleSequential([0, 5], d3.interpolateBlues);

    // Compute the hierarchy without using size property
    const hierarchyData = d3
      .hierarchy(data)
      .sort((a, b) => (a.data.name < b.data.name ? -1 : 1));

    // Count number of leaf nodes to determine node sizes
    hierarchyData.count();

    const root = d3.partition().size([height, width])(hierarchyData);

    // Variable to track the current focus.
    let focus = root;

    // Select the SVG container and set attributes
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height] as any)
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    // Append a group for each node.
    const cell = svg
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.y0},${d.x0})`);

    // Update the rect attributes
    const rect = cell
      .append("rect")
      .attr("width", (d) => d.y1 - d.y0)
      .attr("height", (d) => d.x1 - d.x0)
      .attr("fill-opacity", 0.8)
      .attr("fill", (d) => color(d.depth))
      .style("cursor", "pointer")
      .on("click", clicked);

    // Update the text positioning and styling
    const text = cell
      .append("text")
      .style("user-select", "none")
      .attr("pointer-events", "none")
      .attr("x", 4)
      .attr("y", (d) => (d.x1 - d.x0) / 2)
      .attr("dy", "0.35em")
      .attr("fill-opacity", (d) => +labelVisible(d));

    text.append("tspan").text((d) => d.data.name);

    // Remove the format tspan since we don't have size values

    // Update the title text
    cell.append("title").text((d) =>
      d
        .ancestors()
        .map((d) => d.data.name)
        .reverse()
        .join(" > ")
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
    }

    // Update the rectHeight function
    function rectHeight(d: any) {
      return d.x1 - d.x0;
    }

    // Update the labelVisible function
    function labelVisible(d: any) {
      return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
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
