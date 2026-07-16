import { useShowPangenome } from "@/views/OrganismView/hooks/UseShowPangenome/hook";
import { TAB } from "@brc-analytics/core/views/OrganismView/components/Tabs/constants";
import { Props } from "@brc-analytics/core/views/OrganismView/components/Tabs/types";
import { getActiveTab } from "@brc-analytics/core/views/OrganismView/components/Tabs/utils";
import { TabScrollFuzz } from "@databiosphere/findable-ui/lib/components/common/Tabs/tabs.styles";
import { BackPageTabs } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { useHash } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/hooks/UseHash/hook";
import { Tabs as MTabs, Tab } from "@mui/material";
import { useRouter } from "next/router";
import { type JSX } from "react";

/**
 * Organism-page section tabs. The Pangenome tab is shown only when the
 * `pangenome` feature flag is enabled and the organism's species has a
 * pangenome bundle — matching the PangenomeSection's own gating.
 * @param props - Component props.
 * @param props.ncbiTaxonomyId - Organism's NCBI (species) taxonomy ID.
 * @returns The organism-page tabs.
 */
export const Tabs = ({ ncbiTaxonomyId }: Props): JSX.Element => {
  const { hash } = useHash();
  const { push } = useRouter();
  const showPangenome = Boolean(useShowPangenome(ncbiTaxonomyId));
  return (
    <BackPageTabs>
      <MTabs
        allowScrollButtonsMobile
        onChange={(_, v) => {
          push(`#${v}`);
        }}
        slots={{ scrollButtons: TabScrollFuzz }}
        value={getActiveTab(hash, showPangenome)}
      >
        <Tab label="Workflows" value={TAB.WORKFLOWS} />
        <Tab label="Assemblies" value={TAB.ASSEMBLIES} />
        {showPangenome && <Tab label="Pangenome" value={TAB.PANGENOME} />}
      </MTabs>
    </BackPageTabs>
  );
};
