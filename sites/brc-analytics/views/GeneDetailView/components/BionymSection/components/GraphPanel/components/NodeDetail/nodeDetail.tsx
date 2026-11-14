import {
  DetailPanel,
  EdgeList,
} from "@brc/views/GeneDetailView/components/BionymSection/components/GraphPanel/graphPanel.styles";
import {
  httpsUrl,
  nodeEdges,
} from "@brc/views/GeneDetailView/components/BionymSection/components/GraphPanel/utils";
import { formatConfidence } from "@brc/views/GeneDetailView/components/BionymSection/utils";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { type JSX, useId, useMemo } from "react";
import { type NodeDetailProps } from "./types";

/**
 * The node clicked in the network: its label and type, a link to its source
 * when that is an https: link, and its edges shown at the minimum confidence,
 * each with its confidence. It has no close button: the network keeps its own
 * selection and can't be told to drop it, so the panel closes when a click on
 * empty space or another node changes the network's selection.
 * @param props - Component props.
 * @param props.graph - The graph drawn.
 * @param props.minConfidence - The lowest confidence shown.
 * @param props.node - The node.
 * @returns The panel.
 */
export const NodeDetail = ({
  graph,
  minConfidence,
  node,
}: NodeDetailProps): JSX.Element => {
  const headingId = useId();
  const url = httpsUrl(node);
  // The panel re-renders as the slider moves, but its threshold changes only
  // once the slider settles.
  const edges = useMemo(
    () => nodeEdges(graph, node.id, minConfidence),
    [graph, node.id, minConfidence]
  );
  return (
    <aside aria-labelledby={headingId}>
      <DetailPanel elevation={0}>
        <Typography
          component="h3"
          id={headingId}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
        >
          {node.label}
        </Typography>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          {node.type}
        </Typography>
        {url && <Link label="Source" url={url} />}
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          {edges.length} {edges.length === 1 ? "edge" : "edges"}
        </Typography>
        <EdgeList>
          {edges.map(({ edge, other, outgoing }, i) => (
            <li key={`${edge.subject} ${edge.predicate} ${edge.object} ${i}`}>
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}>
                {outgoing ? "→" : "←"} {edge.predicate}{" "}
                {other?.label ?? (outgoing ? edge.object : edge.subject)}{" "}
                <Typography
                  color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                  component="span"
                  variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
                >
                  (confidence {formatConfidence(edge.confidence)})
                </Typography>
              </Typography>
            </li>
          ))}
        </EdgeList>
      </DetailPanel>
    </aside>
  );
};
