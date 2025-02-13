import * as d3 from "d3";
import { useRef, useEffect } from "react";
import { data } from "./data";

console.debug(data);

export const SectionViz = (): JSX.Element => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing content in case of re-render
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions and radius for the sunburst chart
    const width = 600;
    const height = 600;
    const radius = Math.min(width, height) / 2;

    // Create the main SVG container and center the group
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Define a color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

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
    const root = d3
      .hierarchy(data)
      .sum((d) => d.size || 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create a partition layout (compute full layout, even though we display only two levels)
    d3.partition().size([2 * Math.PI, root.height + 1])(root);

    // Save each node’s initial coordinates for smooth transitions.
    root.each((d) => (d.current = d));

    // Global variable to track the current center (zoomed) node. Initially, it’s the root.
    let currentRoot = root;

    // Create an arc generator that “clamps” the radial depth so that
    // only the center plus two levels (depth 0–2) are visible.
    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => (Math.min(d.y0, 2) * radius) / 2)
      .outerRadius((d) => (Math.min(d.y1, 2) * radius) / 2 - 1);

    // Draw the sunburst segments (skip drawing the root as an arc)
    const path = svg
      .append("g")
      .selectAll("path")
      .data(root.descendants().filter((d) => d.depth))
      .join("path")
      .attr("fill", (d) =>
        d.children ? color(d.data.name) : color(d.parent.data.name)
      )
      // Initially show only nodes at depths 0–2 (relative to the root)
      .attr("fill-opacity", (d) => (d.current.y0 <= 2 ? 1 : 0))
      .attr("d", (d) => arc(d.current))
      .style("cursor", "pointer")
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

    // Helper function to compute label transform.
    // For nodes whose parent is the current center (i.e. first-tier),
    // we add a small extra offset so the label does not overlap the center label.
    function labelTransform(d) {
      const angle = ((d.current.x0 + d.current.x1) / 2) * (180 / Math.PI);
      let r =
        ((Math.min(d.current.y0, 2) + Math.min(d.current.y1, 2)) / 2) *
        (radius / 2);
      if (d.parent === currentRoot) {
        r += 10; // extra offset for first-tier nodes
      }
      return `rotate(${angle - 90}) translate(${r},0) rotate(${angle < 180 ? 0 : 180})`;
    }

    // Add labels for arcs (excluding the center node)
    // Note: We do not filter out the center node here because we want to update its opacity later.
    const label = svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants().filter((d) => d.depth && d.x1 - d.x0 > 0.03))
      .join("text")
      // Hide the label if this node is the current center
      .attr("fill-opacity", (d) =>
        d === currentRoot ? 0 : d.current.y0 <= 2 ? 1 : 0
      )
      .attr("dy", "0.35em")
      .attr("transform", labelTransform)
      .text((d) => d.data.name)
      .style("font-size", "10px");

    // Add a separate center label that always appears horizontally at the center.
    const centerLabel = svg
      .append("text")
      .attr("class", "center-label")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "16px")
      .text(root.data.name)
      .style("pointer-events", "none"); // so clicks fall through to the center circle

    // Add an invisible center circle to act as a zoom-out button.
    // When clicked, if the current center node has a parent, we zoom out.
    const center = svg
      .append("circle")
      .attr("r", radius / 2) // Matches the maximum radius of level 0 (the center)
      .attr("fill", "transparent") // Invisible but catches pointer events
      .style("cursor", "pointer")
      .on("click", function (event) {
        if (currentRoot && currentRoot.parent) {
          clicked(event, currentRoot.parent);
        }
      });

    // Zoom handler: on click, re-root the chart at the clicked node and show only
    // that node plus two levels of children.
    function clicked(event, p) {
      // Update the current center and the center label.
      currentRoot = p;
      centerLabel.text(p.data.name);

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

      const t = svg.transition().duration(750);

      // Transition the arcs.
      path
        .transition(t)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          return (t) => {
            d.current = i(t);
          };
        })
        .attrTween("d", (d) => () => arc(d.current))
        .attr("fill-opacity", (d) =>
          d.ancestors().indexOf(currentRoot) >= 0 && d.current.y0 <= 2 ? 1 : 0
        );

      // Transition the labels.
      label
        .transition(t)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          return (t) => {
            d.current = i(t);
          };
        })
        .attrTween("transform", (d) => () => labelTransform(d))
        .attr("fill-opacity", (d) =>
          d === currentRoot
            ? 0
            : d.ancestors().indexOf(currentRoot) >= 0 && d.current.y0 <= 2
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
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <svg ref={svgRef} />
    </div>
  );
};
