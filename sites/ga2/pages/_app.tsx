import { setFeatureFlags } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/common/utils";
import { config } from "@ga2/config/config";
import { GA2_DEFAULT_DESCRIPTION } from "@ga2/meta/constants";
import { ensureEntitiesLoaded } from "@ga2/services/workflows/hooks/UseEntities/utils";
import "@ga2/styles/fonts/fonts.css";
import { createGa2Theme } from "@ga2/theme/theme";
import {
  AppProviders,
  type AppPropsWithComponent,
} from "@repo/shared/components/layout/AppProviders/appProviders";
import { useEntities } from "@repo/shared/services/workflows/hooks/UseEntities/hook";
import { type JSX } from "react";

setFeatureFlags(["assembly-workflows", "hyphy", "lmls"]);

function MyApp(props: AppPropsWithComponent): JSX.Element {
  const appConfig = config();
  const isEntitiesLoaded = useEntities(ensureEntitiesLoaded);
  return (
    <AppProviders
      appConfig={appConfig}
      appProps={props}
      appTheme={createGa2Theme(props.pageProps.themeOptions)}
      defaultDescription={GA2_DEFAULT_DESCRIPTION}
      isEntitiesLoaded={isEntitiesLoaded}
      loginEnabled={appConfig.loginEnabled}
    />
  );
}

export default MyApp;
