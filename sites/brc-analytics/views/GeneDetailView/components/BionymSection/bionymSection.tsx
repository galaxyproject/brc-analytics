import { GenesPanel } from "@brc/components/Genes/genes.styles";
import { Tabs } from "@databiosphere/findable-ui/lib/components/common/Tabs/tabs";
import { useHash } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/hooks/UseHash/hook";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { formatDate } from "@repo/shared/utils/date-fns/utils";
import { SectionTitle } from "@repo/shared/views/EntityView/ui/SectionTitle/sectionTitle";
import { parseISO } from "date-fns";
import dynamic from "next/dynamic";
import { type JSX, useId, useState } from "react";
import { ClaimsPanel } from "./components/ClaimsPanel/claimsPanel";
import { GraphLoading } from "./components/GraphLoading/graphLoading";
import { BIONYM_URL, DEFAULT_MIN_CONFIDENCE, TAB, TABS } from "./constants";
import { type BionymSectionProps } from "./types";
import { getActiveTab, pushTabHash } from "./utils";

// The graph explorer brings D3 and BioNym's components with it, so it loads
// only when its tab is first opened, and only in the browser.
const GraphPanel = dynamic(
  () => import("./components/GraphPanel/graphPanel").then((m) => m.GraphPanel),
  {
    loading: GraphLoading,
    ssr: false,
  }
);

/**
 * What BioNym gathered about a gene, kept apart from the gene's facts and
 * labelled as BioNym's scored judgments: its claims on one tab and its graph
 * on another, the tab chosen by the URL hash. The tabs share one minimum
 * confidence.
 * @param props - Component props.
 * @param props.bionym - The claims in the gene's BioNym graph.
 * @returns The section.
 */
export const BionymSection = ({ bionym }: BionymSectionProps): JSX.Element => {
  const headingId = useId();
  const { hash } = useHash();
  const tab = getActiveTab(hash);
  const [minConfidence, setMinConfidence] = useState(DEFAULT_MIN_CONFIDENCE);
  const [graphOpened, setGraphOpened] = useState(tab === TAB.GRAPH);
  // Set during render, not in an effect, so the graph shows on the same render
  // as the tab that opens it.
  if (tab === TAB.GRAPH && !graphOpened) setGraphOpened(true);

  return (
    <GenesPanel aria-labelledby={headingId} as="section">
      <SectionTitle
        component="h2"
        id={headingId}
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
      >
        Evidence gathered by BioNym
      </SectionTitle>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
        These claims about the gene were drawn from papers and datasets by a
        language model, and each was scored by{" "}
        <Link label="BioNym" url={BIONYM_URL} /> with a confidence from 0 to 1.
        They are BioNym&apos;s judgments, not facts about the gene. BioNym
        gathered them on {formatDate(parseISO(bionym.runDate))}.
      </Typography>
      <Tabs
        onTabChange={(value): void => {
          pushTabHash(getActiveTab(String(value)));
        }}
        tabs={TABS}
        value={tab}
      />
      {tab === TAB.CLAIMS && (
        <ClaimsPanel
          bionym={bionym}
          minConfidence={minConfidence}
          onMinConfidenceChange={setMinConfidence}
        />
      )}
      {/* Once opened, the graph stays on the page, hidden while the Claims tab
      shows, so its filters, layout and selection survive a tab switch and
      the network isn't drawn again. */}
      {graphOpened && (
        <div hidden={tab !== TAB.GRAPH}>
          <GraphPanel
            geneUid={bionym.geneUid}
            minConfidence={minConfidence}
            onMinConfidenceChange={setMinConfidence}
          />
        </div>
      )}
    </GenesPanel>
  );
};
