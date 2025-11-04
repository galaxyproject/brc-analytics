"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import embed from "vega-embed/build/embed.js";
import type { VisualizationSpec } from "vega-embed/build/embed";
import { VegaEmbedContainer } from "./vegaEmbed.styles";

export interface VegaEmbedProps {
  caption?: ReactNode;
  spec: string | VisualizationSpec;
}

/**
 * VegaEmbed component for rendering Vega-Lite visualizations.
 * @param props - Component props.
 * @param props.caption - Optional caption to display below the visualization.
 * @param props.spec - URL to a JSON spec or a Vega-Lite specification object.
 * @returns JSX element containing the Vega-Lite visualization.
 */
export const VegaEmbed = ({ caption, spec }: VegaEmbedProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSpec = async (): Promise<void> => {
      if (!containerRef.current) return;

      try {
        let vegaSpec: VisualizationSpec;

        // If spec is a string (URL), fetch it
        if (typeof spec === "string") {
          const response = await fetch(spec);
          if (!response.ok) {
            throw new Error(`Failed to fetch spec: ${response.statusText}`);
          }
          vegaSpec = await response.json();
        } else {
          vegaSpec = spec;
        }

        // Embed the visualization
        await embed(containerRef.current, vegaSpec, {
          actions: {
            compiled: false,
            editor: false,
            export: true,
            source: false,
          },
        });
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error loading Vega-Lite spec:", err);
      }
    };

    loadSpec();
  }, [spec]);

  return (
    <VegaEmbedContainer>
      {error && (
        <div className="error">Error loading visualization: {error}</div>
      )}
      <div ref={containerRef} className="vega-container" />
      {caption && <figcaption>{caption}</figcaption>}
    </VegaEmbedContainer>
  );
};
