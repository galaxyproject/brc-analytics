import { config } from "@brc/config/config";
import { BRC_DEFAULT_DESCRIPTION } from "@brc/meta/constants";
import { ensureEntitiesLoaded } from "@brc/services/workflows/hooks/UseEntities/utils";
import { createBrcTheme } from "@brc/theme/theme";
import { setFeatureFlags } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/common/utils";
import {
  AppProviders,
  type AppPropsWithComponent,
} from "@repo/shared/components/layout/AppProviders/appProviders";
import { useEntities } from "@repo/shared/services/workflows/hooks/UseEntities/hook";
import { type JSX } from "react";

setFeatureFlags(["assembly-workflows", "hyphy", "lmls", "pangenome"]);

function MyApp(props: AppPropsWithComponent): JSX.Element {
  const appConfig = config();
  const isEntitiesLoaded = useEntities(ensureEntitiesLoaded);
  return (
    <AppProviders
      appConfig={appConfig}
      appProps={props}
      appTheme={createBrcTheme(props.pageProps.themeOptions)}
      defaultDescription={BRC_DEFAULT_DESCRIPTION}
      isEntitiesLoaded={isEntitiesLoaded}
      loginEnabled={appConfig.loginEnabled}
    />
  );
}

export default MyApp;
