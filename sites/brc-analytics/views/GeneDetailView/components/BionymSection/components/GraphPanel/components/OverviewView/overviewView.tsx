import { toComponentsGraph } from "@brc/views/GeneDetailView/components/BionymSection/components/GraphPanel/utils";
import { BionymOverview } from "bionym-components";
import { type JSX, useEffect, useRef } from "react";
import { type OverviewViewProps } from "./types";

/**
 * BioNym's bar chart of the graph's nodes by type, drawn into a div. A bar
 * click hides or shows that type of node.
 * @param props - Component props.
 * @param props.graph - The whole graph, so every type keeps its bar.
 * @param props.onTypeClick - Called with the type whose bar was clicked.
 * @returns The chart.
 */
export const OverviewView = ({
  graph,
  onTypeClick,
}: OverviewViewProps): JSX.Element => {
  const elRef = useRef<HTMLDivElement>(null);
  const onTypeClickRef = useRef(onTypeClick);

  useEffect(() => {
    onTypeClickRef.current = onTypeClick;
  }, [onTypeClick]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const overview = BionymOverview(el, toComponentsGraph(graph), {
      onBarClick: (nodeType) => onTypeClickRef.current(nodeType),
    });
    return (): void => overview.destroy();
  }, [graph]);

  return <div ref={elRef} />;
};
