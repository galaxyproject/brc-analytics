import { NetworkToolbar } from "@brc/views/GeneDetailView/components/BionymSection/components/GraphPanel/graphPanel.styles";
import { toComponentsGraph } from "@brc/views/GeneDetailView/components/BionymSection/components/GraphPanel/utils";
import FitScreenRoundedIcon from "@mui/icons-material/FitScreenRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import { IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material";
import {
  BionymNetwork,
  type BionymNetworkInstance,
  type BionymNetworkLayout,
} from "bionym-components";
import { type JSX, useEffect, useRef, useState } from "react";
import { type NetworkViewProps } from "./types";

// How far each zoom button zooms.
const ZOOM_STEP = 1.4;

/**
 * BioNym's network, drawn into a div, with a layout switch and zoom buttons,
 * since the network has no buttons of its own.
 * @param props - Component props.
 * @param props.graph - The graph to draw.
 * @param props.minConfidence - The lowest confidence drawn.
 * @param props.onSelect - Called with the node clicked, or null when no node
 * is selected, including after each redraw.
 * @returns The network.
 */
export const NetworkView = ({
  graph,
  minConfidence,
  onSelect,
}: NetworkViewProps): JSX.Element => {
  const elRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<BionymNetworkInstance | null>(null);
  const minConfidenceRef = useRef(minConfidence);
  const onSelectRef = useRef(onSelect);
  const [layout, setLayout] = useState<BionymNetworkLayout>("columns");

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Drawn afresh when the graph or layout changes, which resets pan and zoom,
  // as the network's own update does. Each drawing starts with no node
  // selected, and the network doesn't report that, so this does.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const network = BionymNetwork(el, toComponentsGraph(graph), {
      layout,
      minConfidence: minConfidenceRef.current,
      onSelect: (node) => onSelectRef.current(node?.id ?? null),
    });
    networkRef.current = network;
    onSelectRef.current(null);
    return (): void => {
      network.destroy();
      networkRef.current = null;
    };
  }, [graph, layout]);

  // A new minimum confidence redraws the network, keeping pan and zoom but
  // dropping its selection.
  useEffect(() => {
    if (minConfidenceRef.current === minConfidence) return;
    minConfidenceRef.current = minConfidence;
    networkRef.current?.setMinConfidence(minConfidence);
    onSelectRef.current(null);
  }, [minConfidence]);

  return (
    <div>
      <NetworkToolbar>
        <ToggleButtonGroup
          aria-label="Layout"
          exclusive
          onChange={(_, value: BionymNetworkLayout | null): void => {
            if (value) setLayout(value);
          }}
          size="small"
          value={layout}
        >
          <ToggleButton value="columns">Columns</ToggleButton>
          <ToggleButton value="force">Force</ToggleButton>
        </ToggleButtonGroup>
        <IconButton
          aria-label="Zoom in"
          onClick={(): void => networkRef.current?.zoomBy(ZOOM_STEP)}
          size="small"
        >
          <ZoomInRoundedIcon />
        </IconButton>
        <IconButton
          aria-label="Zoom out"
          onClick={(): void => networkRef.current?.zoomBy(1 / ZOOM_STEP)}
          size="small"
        >
          <ZoomOutRoundedIcon />
        </IconButton>
        <IconButton
          aria-label="Fit the graph"
          onClick={(): void => networkRef.current?.fit()}
          size="small"
        >
          <FitScreenRoundedIcon />
        </IconButton>
      </NetworkToolbar>
      <div ref={elRef} />
    </div>
  );
};
