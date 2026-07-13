import { TabScrollFuzz } from "@databiosphere/findable-ui/lib/components/common/Tabs/tabs.styles";
import { BackPageTabs } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { useHash } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/hooks/UseHash/hook";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { Tabs as MTabs, Tab } from "@mui/material";
import { useRouter } from "next/router";
import { type JSX } from "react";
import { getPangenome } from "../../../../services/workflows/entities";
import { Props } from "./types";

/**
 * Organism-page section tabs. The Pangenome tab is shown only when the
 * `pangenome` feature flag is enabled and the organism's species has a
 * pangenome bundle — matching the PangenomeSection's own gating.
 * @param props - Component props.
 * @param props.ncbiTaxonomyId - Organism's NCBI (species) taxonomy ID.
 * @returns The organism-page tabs.
 */
export const Tabs = ({ ncbiTaxonomyId }: Props): JSX.Element => {
  const isPangenomeEnabled = useFeatureFlag("pangenome");
  const { hash } = useHash();
  const { push } = useRouter();
  const hasPangenome = Boolean(getPangenome(ncbiTaxonomyId));
  const showPangenome = isPangenomeEnabled && hasPangenome;
  // Normalize the active tab to one that's actually rendered: a deep-link to
  // #pangenome while the tab is hidden would otherwise leave MUI Tabs with an
  // unmatched value (no selection + a runtime warning).
  const tabValues = [
    "workflows",
    "assemblies",
    ...(showPangenome ? ["pangenome"] : []),
  ];
  const value = hash && tabValues.includes(hash) ? hash : "workflows";
  return (
    <BackPageTabs>
      <MTabs
        allowScrollButtonsMobile
        onChange={(_, v) => {
          push(`#${v}`);
        }}
        slots={{ scrollButtons: TabScrollFuzz }}
        value={value}
      >
        <Tab label="Workflows" value="workflows" />
        <Tab label="Assemblies" value="assemblies" />
        {showPangenome && <Tab label="Pangenome" value="pangenome" />}
      </MTabs>
    </BackPageTabs>
  );
};
