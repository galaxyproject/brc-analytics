import { ConfidenceControl } from "@brc/views/GeneDetailView/components/BionymSection/components/ConfidenceControl/confidenceControl";
import { GraphLoading } from "@brc/views/GeneDetailView/components/BionymSection/components/GraphLoading/graphLoading";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Chip, Typography } from "@mui/material";
import { useGeneBionymGraph } from "@repo/shared/hooks/useGeneBionymGraph";
import "bionym-components/styles.css";
import { type JSX, useMemo, useState } from "react";
import { EdgeKindSwitches } from "./components/EdgeKindSwitches/edgeKindSwitches";
import { NetworkView } from "./components/NetworkView/networkView";
import { NodeDetail } from "./components/NodeDetail/nodeDetail";
import { OverviewView } from "./components/OverviewView/overviewView";
import { DEFAULT_HIDDEN_PREDICATES, SLIDER_SETTLE_MS } from "./constants";
import { GraphLayout, HiddenTypes } from "./graphPanel.styles";
import { useSettledValue } from "./hooks/useSettledValue";
import { type GraphExplorerProps, type GraphPanelProps } from "./types";
import { countPredicates, countShown, filterGraph } from "./utils";

/**
 * The Graph tab: the gene's BioNym graph, once it has loaded.
 * @param props - Component props.
 * @param props.geneUid - The gene's UID.
 * @param props.minConfidence - The lowest confidence shown.
 * @param props.onMinConfidenceChange - Called with a new minimum confidence.
 * @returns The panel.
 */
export const GraphPanel = ({
  geneUid,
  minConfidence,
  onMinConfidenceChange,
}: GraphPanelProps): JSX.Element => {
  const result = useGeneBionymGraph(geneUid);
  if (result.status === "loading") return <GraphLoading />;
  if (result.status === "unavailable")
    return (
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
        The graph is unavailable right now. Please try again later.
      </Typography>
    );
  return (
    <GraphExplorer
      graph={result.graph}
      minConfidence={minConfidence}
      onMinConfidenceChange={onMinConfidenceChange}
    />
  );
};

/**
 * The graph explorer: an overview of the graph's nodes by type, BioNym's
 * network, and a panel for the node clicked. Kinds of edge and types of node
 * can be hidden; the slider filters the network by confidence.
 * @param props - Component props.
 * @param props.graph - The gene's whole graph.
 * @param props.minConfidence - The lowest confidence shown.
 * @param props.onMinConfidenceChange - Called with a new minimum confidence.
 * @returns The explorer.
 */
const GraphExplorer = ({
  graph,
  minConfidence,
  onMinConfidenceChange,
}: GraphExplorerProps): JSX.Element => {
  const [hiddenPredicates, setHiddenPredicates] = useState(
    DEFAULT_HIDDEN_PREDICATES
  );
  const [hiddenTypes, setHiddenTypes] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const drawn = useMemo(
    () => filterGraph(graph, hiddenPredicates, hiddenTypes),
    [graph, hiddenPredicates, hiddenTypes]
  );
  const predicateCounts = useMemo(() => countPredicates(graph), [graph]);
  // The network, the panel and the count take the slider's value once it
  // settles, so the count always describes the network on screen.
  const settledMinConfidence = useSettledValue(minConfidence, SLIDER_SETTLE_MS);
  const shown = countShown(drawn, settledMinConfidence);
  const selected = selectedId
    ? drawn.nodes.find((node) => node.id === selectedId)
    : undefined;

  const togglePredicate = (predicate: string): void =>
    setHiddenPredicates((hidden) => toggled(hidden, predicate));
  const toggleType = (nodeType: string): void =>
    setHiddenTypes((hidden) => toggled(hidden, nodeType));

  return (
    <>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
        The graph links the gene to what BioNym found about it: its relatives,
        assemblies, papers, datasets and the claims drawn from them. Click a
        node to see its edges.
      </Typography>
      <ConfidenceControl
        count={`${shown.nodes} nodes and ${shown.edges} of ${graph.edges.length} edges`}
        minConfidence={minConfidence}
        onMinConfidenceChange={onMinConfidenceChange}
      />
      {/* The bars count the whole graph, not the network drawn below, so
      every type keeps a bar to click. */}
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
        Every node in BioNym&apos;s graph, by type. Click a bar to hide or show
        that type.
      </Typography>
      <OverviewView graph={graph} onTypeClick={toggleType} />
      {hiddenTypes.size > 0 && (
        <HiddenTypes>
          <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
            Hidden types of node:
          </Typography>
          {[...hiddenTypes].sort().map((nodeType) => (
            <Chip
              key={nodeType}
              label={nodeType}
              onDelete={(): void => toggleType(nodeType)}
              size="small"
            />
          ))}
        </HiddenTypes>
      )}
      <GraphLayout>
        <NetworkView
          graph={drawn}
          minConfidence={settledMinConfidence}
          onSelect={setSelectedId}
        />
        {selected ? (
          <NodeDetail
            graph={drawn}
            minConfidence={settledMinConfidence}
            node={selected}
          />
        ) : (
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
          >
            Click a node to see its edges.
          </Typography>
        )}
      </GraphLayout>
      <EdgeKindSwitches
        counts={predicateCounts}
        hidden={hiddenPredicates}
        onToggle={togglePredicate}
      />
    </>
  );
};

/**
 * A set with a value added if it was missing, or removed if it was there.
 * @param set - The set.
 * @param value - The value.
 * @returns A new set.
 */
function toggled(set: ReadonlySet<string>, value: string): ReadonlySet<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
