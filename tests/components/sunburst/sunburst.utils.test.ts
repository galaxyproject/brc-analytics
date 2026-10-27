import {
  type TaxonomyNode,
  type TreeNode,
} from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/types";
import {
  createFilterUrl,
  findNodeByName,
  getEquidistantColors,
  getNodeColor,
  getVisibleNodes,
  layoutRelativeTo,
} from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/utils";
import { hsl } from "d3-color";
import { hierarchy, partition } from "d3-hierarchy";
import { sampleTree, taxon } from "./fixtures";

/**
 * Partitions a taxonomy the way the chart does.
 * @param data - Taxonomy tree.
 * @returns The partitioned root.
 */
function layout(data: TaxonomyNode): TreeNode {
  const root = hierarchy(data)
    .sum((d) => (d.children.length === 0 ? 1 : 0))
    .sort((a, b) => (a.data.name < b.data.name ? -1 : 1));
  return partition<TaxonomyNode>().size([2 * Math.PI, root.height + 1])(
    root
  ) as TreeNode;
}

const PALETTE = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

describe("getEquidistantColors", () => {
  it("returns nothing for no colours and the first colour for one", () => {
    expect(getEquidistantColors(PALETTE, 0)).toEqual([]);
    expect(getEquidistantColors(PALETTE, 1)).toEqual(["#ff0000"]);
  });

  it("samples evenly when the map has enough colours", () => {
    expect(getEquidistantColors(PALETTE, 2)).toEqual(["#ff0000", "#0000ff"]);
    expect(getEquidistantColors(PALETTE, 4)).toEqual(PALETTE);
  });

  it("interpolates when more colours are wanted than the map holds", () => {
    const colors = getEquidistantColors(PALETTE, 7);
    expect(colors).toHaveLength(7);
    expect(new Set(colors).size).toBe(7);
    expect(hsl(colors[0]).formatHex()).toBe("#ff0000");
    expect(hsl(colors[6]).formatHex()).toBe("#ffff00");
  });
});

describe("getVisibleNodes", () => {
  it("returns the rings around the center, not the center or deeper", () => {
    const root = layout(sampleTree());
    const visible = getVisibleNodes(root, 4);
    expect(visible.every((d) => d.depth >= 1 && d.depth <= 3)).toBe(true);
    expect(visible).toHaveLength(
      root.descendants().filter((d) => d.depth >= 1 && d.depth <= 3).length
    );
  });

  it("returns only the center's subtree when zoomed in", () => {
    const root = layout(sampleTree());
    const beta = findNodeByName(root, "Beta");
    const visible = getVisibleNodes(beta, 4);
    expect(visible.map((d) => d.data.name)).toEqual(["c-0", "c-1", "c-2"]);
  });
});

describe("layoutRelativeTo", () => {
  it("stretches the center's span to the full circle", () => {
    const root = layout(sampleTree());
    const alpha = findNodeByName(root, "Alpha");
    const coords = layoutRelativeTo(alpha, alpha);
    expect(coords.x0).toBeCloseTo(0);
    expect(coords.x1).toBeCloseTo(2 * Math.PI);
    expect(coords.y0).toBe(0);
    expect(coords.y1).toBe(1);
  });

  it("collapses nodes outside the center's subtree to zero angle", () => {
    const root = layout(sampleTree());
    const alpha = findNodeByName(root, "Alpha");
    const gamma = findNodeByName(root, "Gamma");
    const coords = layoutRelativeTo(gamma, alpha);
    expect(coords.x1 - coords.x0).toBe(0);
  });
});

describe("getNodeColor", () => {
  it("gives each child of the center its own colour by position", () => {
    const root = layout(sampleTree());
    const colors = getEquidistantColors(PALETTE, 3);
    const names = ["Alpha", "Beta", "Gamma"];
    expect(
      names.map((name) =>
        getNodeColor(findNodeByName(root, name), root, colors)
      )
    ).toEqual(colors);
  });

  it("gives the same answer whatever order nodes are coloured in", () => {
    // The old chart coloured through a d3 ordinal scale whose domain grew in
    // whatever order nodes were first asked about, so the same view could
    // come out differently depending on what had been drawn before.
    const root = layout(sampleTree());
    const alpha = findNodeByName(root, "Alpha");
    const colors = getEquidistantColors(PALETTE, alpha.children?.length ?? 0);
    const nodes = getVisibleNodes(alpha, 4);
    const forward = nodes.map((d) => getNodeColor(d, alpha, colors));
    const backward = [...nodes]
      .reverse()
      .map((d) => getNodeColor(d, alpha, colors))
      .reverse();
    expect(forward).toEqual(backward);
  });

  it("lightens deeper rings from their center-child's colour", () => {
    const root = layout(sampleTree());
    const colors = getEquidistantColors(PALETTE, 3);
    const beta = findNodeByName(root, "Beta");
    const deeper = findNodeByName(root, "c-0");
    expect(hsl(getNodeColor(deeper, root, colors)).l).toBeGreaterThan(
      hsl(getNodeColor(beta, root, colors)).l
    );
  });
});

describe("findNodeByName", () => {
  it("falls back to the root for an unknown name", () => {
    const root = layout(taxon("root", [taxon("Only")]));
    expect(findNodeByName(root, "Missing")).toBe(root);
    expect(findNodeByName(root, "Only").data.name).toBe("Only");
  });
});

describe("createFilterUrl", () => {
  it("filters the assemblies table by rank", () => {
    expect(createFilterUrl("Genus", "Plasmodium")).toEqual({
      href: "/data/assemblies",
      query: encodeURIComponent(
        JSON.stringify({
          filter: [
            { categoryKey: "taxonomicLevelGenus", value: ["Plasmodium"] },
          ],
        })
      ),
    });
  });

  it("returns an empty URL for ranks with no filter", () => {
    expect(createFilterUrl("no rank", "root")).toBe("");
    expect(createFilterUrl(undefined, "root")).toBe("");
  });
});
