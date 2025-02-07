import * as d3 from "d3";
import { Fragment, useRef, useEffect } from "react";

export const SectionViz = (): JSX.Element => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Sample data for organisms
  /* eslint-disable sort-keys */
  const data = {
    name: "Organisms",
    children: [
      {
        name: "Fungi",
        children: [
          {
            name: "Candida albicans",
            children: [{ name: "235443", size: 1 }],
          },
          {
            name: "Aspergillus fumigatus",
            children: [{ name: "214684", size: 1 }],
          },
        ],
      },
      {
        name: "Bacteria",
        children: [
          {
            name: "Escherichia coli",
            children: [{ name: "562", size: 1 }],
          },
          {
            name: "Staphylococcus aureus",
            children: [{ name: "1280", size: 1 }],
          },
        ],
      },
      {
        name: "Insecta",
        children: [
          {
            name: "Apis mellifera",
            children: [{ name: "7460", size: 1 }],
          },
          {
            name: "Drosophila melanogaster",
            children: [{ name: "7227", size: 1 }],
          },
        ],
      },
      {
        name: "Viruses",
        children: [
          {
            name: "Influenza A virus",
            children: [{ name: "11320", size: 1 }],
          },
          {
            name: "Human immunodeficiency virus",
            children: [{ name: "11676", size: 1 }],
          },
        ],
      },
    ],
  };

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
    // The sum() function uses the 'size' field (defaulting to 1 if not present)
    const root = d3
      .hierarchy(data)
      .sum((d: any) => d.size || 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create a partition layout for the sunburst
    d3.partition().size([2 * Math.PI, root.height + 1])(root);

    // Create an arc generator for the segments
    const arc = d3
      .arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .innerRadius((d: any) => (d.y0 * radius) / (root.height + 1))
      .outerRadius((d: any) => (d.y1 * radius) / (root.height + 1) - 1);

    // Draw the sunburst segments
    svg
      .selectAll("path")
      .data(root.descendants())
      .join("path")
      // Hide the very center (root) node
      .attr("display", (d: any) => (d.depth ? null : "none"))
      .attr("d", arc)
      .style("fill", (d: any) =>
        // Group nodes get their own color; leaf nodes use their parent's color
        d.children ? color(d.data.name) : color(d.parent.data.name)
      )
      .style("cursor", "pointer")
      .on("mouseover", function (event: any, d: any) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`<strong>${d.data.name}</strong><br/>Value: ${d.value}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .on("click", function (event: any, d: any) {
        console.log("Clicked node:", d.data);
      });

    // Optionally, add labels for arcs that are wide enough
    svg
      .selectAll("text")
      .data(root.descendants().filter((d: any) => d.x1 - d.x0 > 0.03))
      .join("text")
      .attr("transform", function (d: any) {
        const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
        const y = ((d.y0 + d.y1) / 2) * (radius / (root.height + 1));
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) =>
        (d.x0 + d.x1) / 2 > Math.PI ? "end" : "start"
      )
      .text((d: any) => d.data.name)
      .style("font-size", "10px");

    // Clean up on component unmount: remove tooltip and clear svg.
    return () => {
      tooltip.remove();
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, []);

  return (
    <Fragment>
      <svg ref={svgRef} />
    </Fragment>
  );
};
