import { type JSX, useEffect, useRef, useState } from "react";
import { type SunburstChartProps } from "./sunburstChart";
import { type TaxonomyNode } from "./types";

type SunburstProps = {
  depth?: number;
  /**
   * Fetches the taxonomy tree; keep its identity stable (define it at module
   * scope), since a new one reloads. Called once the chart is about to scroll
   * into view, so the tree (several hundred kB) stays out of the home page bundle.
   */
  loadData: () => Promise<TaxonomyNode>;
  logoPath: string;
  startingNode?: string;
};

type Loaded = {
  Chart: (props: SunburstChartProps) => JSX.Element;
  data: TaxonomyNode;
};

/**
 * The home page taxonomy sunburst.
 *
 * The chart (d3) and the tree it draws are imported dynamically when the
 * section nears the viewport, rather than statically. Measured on the BRC
 * production build, a static import put both in the home page chunk -- 438 kB
 * of it, ahead of the hero -- for a chart below the fold.
 * @param props - Component props.
 * @param props.depth - Rings shown, including the center disc.
 * @param props.loadData - Fetches the taxonomy tree.
 * @param props.logoPath - Logo drawn in the center at the root.
 * @param props.startingNode - Taxon name to center on initially.
 * @returns The chart, or space reserved for it while it loads.
 */
export const Sunburst = ({
  depth = 4,
  loadData,
  logoPath,
  startingNode = "root",
}: SunburstProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    const load = (): void => {
      Promise.all([import("./sunburstChart"), loadData()])
        .then(([module, data]) => {
          if (!cancelled) setLoaded({ Chart: module.SunburstChart, data });
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };
    if (typeof IntersectionObserver === "undefined") {
      load();
      return (): void => {
        cancelled = true;
      };
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(container);
    return (): void => {
      cancelled = true;
      observer.disconnect();
    };
  }, [loadData]);

  if (loaded) {
    const { Chart, data } = loaded;
    return (
      <Chart
        data={data}
        depth={depth}
        logoPath={logoPath}
        startingNode={startingNode}
      />
    );
  }
  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        margin: "0 auto",
        maxWidth: "1136px",
        width: "100%",
      }}
    >
      <div
        style={{
          aspectRatio: "1",
          maxWidth: "800px",
          width: "70%",
        }}
      >
        {failed && <p>The taxonomy chart could not be loaded.</p>}
      </div>
    </div>
  );
};
