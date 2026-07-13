import { useHash } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/hooks/UseHash/hook";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { Tabs as MTabs, Tab } from "@mui/material";
import { useRouter } from "next/router";
import { type JSX } from "react";

export const Tabs = (): JSX.Element => {
  const isPangenomeEnabled = useFeatureFlag("pangenome");
  const { hash } = useHash();
  const { push } = useRouter();
  return (
    <MTabs
      onChange={(_, v) => {
        push(`#${v}`);
      }}
      value={hash || "workflows"}
    >
      <Tab label="Workflows" value="workflows" />
      <Tab label="Assemblies" value="assemblies" />
      {isPangenomeEnabled && <Tab label="Pangenome" value="pangenome" />}
    </MTabs>
  );
};
