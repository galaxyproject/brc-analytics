import { GraphLoading } from "@brc/views/GeneDetailView/components/BionymSection/components/GraphLoading/graphLoading";
import { GraphPanel } from "@brc/views/GeneDetailView/components/BionymSection/components/GraphPanel/graphPanel";
import {
  filterGraph,
  httpsUrl,
} from "@brc/views/GeneDetailView/components/BionymSection/components/GraphPanel/utils";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { type GeneBionymGraphResult } from "@repo/shared/hooks/useGeneBionymGraph";
import {
  type BionymGraph,
  type BionymGraphNode,
} from "@repo/shared/services/genes/types";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { type JSX, useState } from "react";
// jest-dom matchers aren't registered globally in this repo's jest config.
import "@testing-library/jest-dom";

// What the fake BioNym components were drawn with, newest last.
interface MockDrawing {
  graph: BionymGraph;
  instance: Record<string, jest.Mock>;
  opts: {
    layout?: string;
    minConfidence?: number;
    onBarClick?: (nodeType: string) => void;
    onSelect?: (node: BionymGraphNode | null) => void;
  };
}
const mockNetworks: MockDrawing[] = [];
const mockOverviews: MockDrawing[] = [];

// BioNym's components are ES modules that draw with D3, which Jest can't
// load; these fakes record what they're drawn with. The graph they're given
// is in BioNym's shape, with its root as metadata.query; the tests read it
// back in the API's shape.
jest.mock("bionym-components", () => {
  const record =
    (drawings: MockDrawing[], methods: string[]) =>
    (
      _el: HTMLElement,
      graph: {
        edges: BionymGraph["edges"];
        metadata: { query: string };
        nodes: BionymGraph["nodes"];
      },
      opts: MockDrawing["opts"] = {}
    ): Record<string, jest.Mock> => {
      const instance = Object.fromEntries(methods.map((m) => [m, jest.fn()]));
      drawings.push({
        graph: {
          edges: graph.edges,
          geneUid: "",
          nodes: graph.nodes,
          query: graph.metadata.query,
        },
        instance,
        opts,
      });
      return instance;
    };
  // Delegate at call time: the components are imported while this module is
  // still initialising, so naming the arrays here directly would hit the TDZ.
  return {
    BionymNetwork: (
      ...args: Parameters<ReturnType<typeof record>>
    ): Record<string, jest.Mock> =>
      record(mockNetworks, ["destroy", "fit", "setMinConfidence", "zoomBy"])(
        ...args
      ),
    BionymOverview: (
      ...args: Parameters<ReturnType<typeof record>>
    ): Record<string, jest.Mock> => record(mockOverviews, ["destroy"])(...args),
  };
});

let mockResult: GeneBionymGraphResult = { status: "loading" };
jest.mock("@repo/shared/hooks/useGeneBionymGraph", () => ({
  useGeneBionymGraph: (): GeneBionymGraphResult => mockResult,
}));

const NODES: BionymGraphNode[] = [
  {
    id: "PF3D7_0000000",
    label: "Gene 1",
    type: "Gene",
    url: "https://veupathdb.org/gene/PF3D7_0000000",
  },
  {
    id: "pubmed:1",
    label: "A paper",
    type: "Publication",
    url: "https://pubmed.ncbi.nlm.nih.gov/1/",
  },
  { id: "claim:1", label: "Claim 1", type: "Claim", url: null },
  { id: "claim:2", label: "Claim 2", type: "Claim", url: null },
  { id: "protein:1", label: "Protein 1", type: "Protein", url: null },
  {
    id: "dataset:1",
    label: "A dataset",
    type: "Dataset",
    url: "javascript:alert(1)",
  },
];

const GRAPH: BionymGraph = {
  edges: [
    {
      confidence: 1,
      object: "PF3D7_0000000",
      predicate: "cited_in",
      subject: "pubmed:1",
    },
    {
      confidence: 0.99,
      object: "claim:1",
      predicate: "reports",
      subject: "pubmed:1",
    },
    {
      confidence: 0.5,
      object: "claim:2",
      predicate: "reports",
      subject: "pubmed:1",
    },
    // A kind of edge hidden by default.
    {
      confidence: 1,
      object: "protein:1",
      predicate: "has_member",
      subject: "PF3D7_0000000",
    },
    {
      confidence: 0.9,
      object: "PF3D7_0000000",
      predicate: "measured_in",
      subject: "dataset:1",
    },
  ],
  geneUid: "f0adadd3-973b-5c61-9e11-7c688b4e0895",
  nodes: NODES,
  query: "PF3D7_0000000",
};

const theme = createTheme();

/**
 * The Graph tab, holding the minimum confidence as the section does.
 * @returns The tab.
 */
function Harness(): JSX.Element {
  const [minConfidence, setMinConfidence] = useState(0.8);
  return (
    <GraphPanel
      geneUid={GRAPH.geneUid}
      minConfidence={minConfidence}
      onMinConfidenceChange={setMinConfidence}
    />
  );
}

/**
 * Render the Graph tab.
 */
function renderPanel(): void {
  render(
    <ThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <Harness />
      </EmotionThemeProvider>
    </ThemeProvider>
  );
}

/**
 * The network as last drawn.
 * @returns The latest drawing.
 */
function network(): MockDrawing {
  const drawing = mockNetworks.at(-1);
  if (!drawing) throw new Error("No network drawn");
  return drawing;
}

/**
 * The ids of the nodes the network was last drawn with.
 * @returns The ids, sorted.
 */
function drawnNodeIds(): string[] {
  return network()
    .graph.nodes.map((node) => node.id)
    .sort();
}

/**
 * Click a node in the network, as BioNym's network reports it.
 * @param id - The node's id.
 */
function selectNode(id: string): void {
  const node = NODES.find((n) => n.id === id) ?? null;
  act(() => network().opts.onSelect?.(node));
}

beforeEach(() => {
  mockNetworks.length = 0;
  mockOverviews.length = 0;
  mockResult = { graph: GRAPH, status: "found" };
});

describe("GraphPanel", () => {
  it("says so while the graph loads, or when it's unavailable", () => {
    mockResult = { status: "loading" };
    const { rerender } = render(<Harness />);
    expect(screen.getByText("Loading the graph…")).toBeInTheDocument();
    mockResult = { status: "unavailable" };
    rerender(<Harness />);
    expect(
      screen.getByText(/The graph is unavailable right now/)
    ).toBeInTheDocument();
    expect(mockNetworks).toHaveLength(0);
  });

  it("draws the network without the kinds of edge hidden by default", () => {
    renderPanel();
    expect(drawnNodeIds()).toStrictEqual([
      "PF3D7_0000000",
      "claim:1",
      "claim:2",
      "dataset:1",
      "pubmed:1",
    ]);
    expect(network().graph.query).toBe("PF3D7_0000000");
    expect(network().opts).toMatchObject({
      layout: "columns",
      minConfidence: 0.8,
    });
    // The overview counts the whole graph, so every type keeps its bar.
    expect(mockOverviews.at(-1)?.graph.nodes).toHaveLength(NODES.length);
    expect(screen.getByText("4 nodes and 3 of 5 edges")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "has_member (1)" })
    ).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "reports (2)" })).toBeChecked();
  });

  it("draws a kind of edge when its switch is turned on", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("switch", { name: "has_member (1)" }));
    expect(drawnNodeIds()).toContain("protein:1");
    expect(screen.getByText("5 nodes and 4 of 5 edges")).toBeInTheDocument();
  });

  it("filters the drawn network by the slider once it settles, without redrawing it", async () => {
    renderPanel();
    const drawn = network();
    selectNode("pubmed:1");
    const before = screen.getByText(/ nodes and /).textContent;
    fireEvent.change(
      screen.getByRole("slider", { name: "Minimum confidence" }),
      { target: { value: 0.95 } }
    );
    // The network and the count follow the slider together, once it settles.
    expect(screen.getByText(/ nodes and /)).toHaveTextContent(before ?? "");
    expect(drawn.instance.setMinConfidence).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(drawn.instance.setMinConfidence).toHaveBeenCalledWith(0.95)
    );
    expect(screen.getByText("3 nodes and 2 of 5 edges")).toBeInTheDocument();
    expect(network()).toBe(drawn);
    // Redrawn, the network has no node selected, so the panel closes.
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("hides a type of node when its bar is clicked, until its chip is removed", () => {
    renderPanel();
    // The bars count the whole graph, and say so.
    expect(
      screen.getByText(/^Every node in BioNym's graph, by type\./)
    ).toBeInTheDocument();
    act(() => mockOverviews.at(-1)?.opts.onBarClick?.("Claim"));
    expect(drawnNodeIds()).not.toContain("claim:1");
    const chip = screen.getByRole("button", { name: "Claim" });
    fireEvent.click(within(chip).getByTestId("CancelIcon"));
    expect(drawnNodeIds()).toContain("claim:1");
  });

  it("shows a clicked node's edges, each with its confidence, and its https: link", () => {
    renderPanel();
    selectNode("pubmed:1");
    const panel = screen.getByRole("complementary", { name: "A paper" });
    expect(panel).toHaveTextContent("Publication");
    expect(within(panel).getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://pubmed.ncbi.nlm.nih.gov/1/"
    );
    expect(
      within(panel)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toStrictEqual([
      "→ cited_in Gene 1 (confidence 1.00)",
      "→ reports Claim 1 (confidence 0.99)",
    ]);
    // No close button: the network can't be told to drop its selection.
    expect(within(panel).queryByRole("button")).not.toBeInTheDocument();
    // A click on empty space deselects the node, and the panel closes.
    selectNode("none");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("links no node whose URL isn't https:", () => {
    renderPanel();
    selectNode("dataset:1");
    const panel = screen.getByRole("complementary", { name: "A dataset" });
    expect(within(panel).queryByRole("link")).not.toBeInTheDocument();
  });

  it("redraws in the force layout, and zooms and fits", () => {
    renderPanel();
    const columns = network();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit the graph" }));
    expect(columns.instance.zoomBy).toHaveBeenCalledTimes(2);
    expect(columns.instance.fit).toHaveBeenCalled();
    selectNode("pubmed:1");
    fireEvent.click(screen.getByRole("button", { name: "Force" }));
    expect(columns.instance.destroy).toHaveBeenCalled();
    expect(network().opts.layout).toBe("force");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
});

describe("filterGraph", () => {
  it("keeps the gene's own node when its type is hidden", () => {
    const filtered = filterGraph(GRAPH, new Set(), new Set(["Gene"]));
    expect(filtered.nodes.map((node) => node.id)).toContain("PF3D7_0000000");
    expect(
      filtered.edges.some(
        (edge) =>
          edge.subject === "PF3D7_0000000" || edge.object === "PF3D7_0000000"
      )
    ).toBe(false);
  });
});

describe("httpsUrl", () => {
  it.each([
    [
      "https://pubmed.ncbi.nlm.nih.gov/1/",
      "https://pubmed.ncbi.nlm.nih.gov/1/",
    ],
    ["http://pubmed.ncbi.nlm.nih.gov/1/", null],
    ["javascript:alert(1)", null],
    ["not a url", null],
    [null, null],
  ])("gives %s as %s", (url, expected) => {
    expect(httpsUrl({ id: "x", label: "x", type: "Dataset", url })).toBe(
      expected
    );
  });
});

describe("GraphLoading", () => {
  it("says so when the Graph tab's code fails to load", () => {
    render(<GraphLoading error={new Error("ChunkLoadError")} />);
    expect(
      screen.getByText("The graph couldn't be loaded. Please reload the page.")
    ).toBeInTheDocument();
  });
});
