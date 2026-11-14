// bionym-components ships plain JavaScript with no types. These cover the
// parts the gene page's graph explorer uses; see the package's README.
declare module "bionym-components" {
  export interface BionymComponentsNode {
    id: string;
    label: string;
    type: string;
    url: string | null;
  }

  export interface BionymComponentsEdge {
    confidence: number;
    object: string;
    predicate: string;
    subject: string;
  }

  export interface BionymComponentsGraph {
    edges: BionymComponentsEdge[];
    metadata: { query: string };
    nodes: BionymComponentsNode[];
  }

  export type BionymNetworkLayout = "columns" | "force";

  export interface BionymNetworkOptions {
    layout?: BionymNetworkLayout;
    minConfidence?: number;
    onSelect?: (node: BionymComponentsNode | null) => void;
  }

  export interface BionymNetworkInstance {
    destroy(): void;
    fit(): void;
    setMinConfidence(minConfidence: number): void;
    zoomBy(factor: number): void;
  }

  export function BionymNetwork(
    el: HTMLElement,
    graph: BionymComponentsGraph,
    opts?: BionymNetworkOptions
  ): BionymNetworkInstance;

  export interface BionymOverviewOptions {
    onBarClick?: (nodeType: string) => void;
  }

  export interface BionymOverviewInstance {
    destroy(): void;
  }

  export function BionymOverview(
    el: HTMLElement,
    graph: BionymComponentsGraph,
    opts?: BionymOverviewOptions
  ): BionymOverviewInstance;
}
