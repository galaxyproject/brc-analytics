import * as d3 from "d3";
import { useRef, useEffect, useState } from "react";
import { data } from "./data";
import { NodeDetails } from "./NodeDetails";

const DEPTH = 2;

export const SectionViz = (): JSX.Element => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing content in case of re-render
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions and radius for the sunburst chart
    const width = 800;
    const height = width;
    const radius = (width - 10) / 2;

    // Create the main SVG container and center the group
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, width])
      .style("font", "10px sans-serif");

    // Define a color scale
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Create a tooltip for interactivity
    const tooltip = d3
      .select("body")
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
    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.size || 1)
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

    const root = d3.partition().size([2 * Math.PI, hierarchy.height + 1])(
      hierarchy
    );

    root.each((d: any) => (d.current = d));

    // Create a partition layout (compute the full layout even though we display only DEPTH layers)
    d3.partition().size([2 * Math.PI, root.height + 1])(root);

    // Save each node’s initial coordinates for smooth transitions.
    root.each((d) => (d.current = d));

    // Global variable to track the current center (zoomed) node. Initially, it’s the root.
    let currentRoot = root;

    // An arc generator that “clamps” the radial depth so that
    // only the center plus DEPTH levels are visible.
    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => (Math.min(d.y0, DEPTH) * radius) / DEPTH)
      .outerRadius((d) => (Math.min(d.y1, DEPTH) * radius) / DEPTH - 1);

    // Draw the sunburst segments (we still don’t draw the center node as an arc)
    const path = svg
      .append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
      .attr("fill", (d) =>
        d.children ? color(d.data.name) : color(d.parent!.data.name)
      )
      // Show only nodes with relative depth <= DEPTH.
      .attr("fill-opacity", (d) => (d.current.y0 <= DEPTH ? 1 : 0))
      .attr("d", (d) => arc(d.current))
      .style("cursor", "pointer")
      // .style("stroke", "#333")
      // .style("stroke-width", "1px")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`<strong>${d.data.name}</strong><br/>Value: ${d.value}`)
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
        d === currentRoot ? 0 : d.current.y0 <= DEPTH ? 1 : 0
      )
      .attr("dy", "0.35em")
      .attr("transform", labelTransform)
      .text((d) => d.data.name);

    // Add a separate center label that always appears horizontally at the center.
    const centerLabel = svg
      .append("text")
      .attr("class", "center-label")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "16px")
      .text(root.data.name)
      .style("pointer-events", "none");

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
      // Update the current center and the center label.
      currentRoot = p;
      centerLabel.text(p.data.name);
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
        };
      });

      const transition = svg.transition().duration(750);

      // Transition the arcs.
      path
        .transition(transition)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          return (transition_duration) => {
            d.current = i(transition_duration);
          };
        })
        .attrTween("d", (d) => () => arc(d.current))
        .attr("fill-opacity", (d) =>
          d.ancestors().indexOf(currentRoot) >= 0 && d.current.y0 <= 3 ? 1 : 0
        );

      // // Transition the labels.
      label
        .transition(transition)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          return (transition) => {
            d.current = i(transition);
          };
        })
        .attrTween("transform", (d) => () => labelTransform(d))
        .attr("fill-opacity", (d) =>
          d === currentRoot
            ? 0
            : d.ancestors().indexOf(currentRoot) >= 0 && d.current.y0 <= 3
              ? 1
              : 0
        );
    }

    // Clean up on component unmount: remove tooltip and clear svg.
    return () => {
      tooltip.remove();
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, []);

  return (
    /* <!-- todo: use standard section layouts... --> */
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
