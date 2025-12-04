"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import embed from "vega-embed";
import type { VisualizationSpec } from "vega-embed";
import { VegaEmbedContainer } from "./vegaEmbed.styles";

export interface VegaEmbedProps {
  caption?: ReactNode;
  spec: string | VisualizationSpec;
}

/**
 * Extract genome_pos extent from a single dataset array.
 * @param dataset - Array of data points.
 * @returns The min and max values found in this dataset.
 */
function getDatasetExtent(dataset: unknown[]): {
  max: number;
  min: number;
} {
  let min = Infinity;
  let max = -Infinity;

  for (const dataPoint of dataset) {
    const point = dataPoint as Record<string, unknown>;
    if (
      point.genome_pos !== undefined &&
      typeof point.genome_pos === "number"
    ) {
      min = Math.min(min, point.genome_pos);
      max = Math.max(max, point.genome_pos);
    }
  }

  return { max, min };
}

/**
 * Calculate the data extent for genome_pos field in datasets.
 * @param vegaSpec - The Vega specification.
 * @returns The min and max values, or null if no data found.
 */
function calculateGenomePosExtent(
  vegaSpec: VisualizationSpec
): [number, number] | null {
  let xMin = Infinity;
  let xMax = -Infinity;

  if (vegaSpec.datasets) {
    const datasets = Object.values(
      vegaSpec.datasets as Record<string, unknown>
    );
    for (const dataset of datasets) {
      if (Array.isArray(dataset)) {
        const { max, min } = getDatasetExtent(dataset);
        xMin = Math.min(xMin, min);
        xMax = Math.max(xMax, max);
      }
    }
  }

  return xMin !== Infinity && xMax !== -Infinity ? [xMin, xMax] : null;
}

/**
 * Set explicit x-axis domain on a Vega spec to ensure proper centering.
 * @param vegaSpec - The Vega specification to modify.
 * @param domain - The domain to set [min, max].
 */
function setXAxisDomain(
  vegaSpec: VisualizationSpec,
  domain: [number, number]
): void {
  const spec = vegaSpec as Record<string, unknown>;

  if (spec.vconcat && Array.isArray(spec.vconcat)) {
    for (const view of spec.vconcat) {
      const v = view as Record<string, unknown>;
      const encoding = v.encoding as Record<string, unknown> | undefined;
      if (encoding?.x) {
        const x = encoding.x as Record<string, unknown>;
        encoding.x = {
          ...x,
          scale: {
            ...(x.scale as Record<string, unknown> | undefined),
            domain,
            nice: false,
          },
        };
      }
    }
  } else if (spec.encoding) {
    const encoding = spec.encoding as Record<string, unknown>;
    if (encoding.x) {
      const x = encoding.x as Record<string, unknown>;
      encoding.x = {
        ...x,
        scale: {
          ...(x.scale as Record<string, unknown> | undefined),
          domain,
          nice: false,
        },
      };
    }
  }
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
    let result: Awaited<ReturnType<typeof embed>> | null = null;

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

        // Calculate and set x-axis domain for proper centering
        const extent = calculateGenomePosExtent(vegaSpec);
        if (extent) {
          const [min, max] = extent;
          const range = max - min;
          const padding = range * 0.05;
          const paddedExtent: [number, number] = [min - padding, max + padding];
          setXAxisDomain(vegaSpec, paddedExtent);
        }

        // Embed the visualization with responsive sizing
        result = await embed(containerRef.current, vegaSpec, {
          actions: {
            compiled: false,
            editor: false,
            export: true,
            source: false,
          },
          config: {
            autosize: {
              resize: true,
              type: "fit-x",
            },
            scale: {
              nice: false,
            },
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

    return (): void => {
      if (result) {
        result.finalize();
      }
    };
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
