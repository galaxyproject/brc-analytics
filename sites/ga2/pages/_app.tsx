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
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { type JSX } from "react";

setFeatureFlags([
  FEATURE_FLAGS.ASSEMBLY_WORKFLOWS,
  FEATURE_FLAGS.HYPHY,
  FEATURE_FLAGS.LMLS,
]);

function MyApp(props: AppPropsWithComponent): JSX.Element {
  const appConfig = config();
  return (
    <AppProviders
      appConfig={appConfig}
      appProps={props}
      appTheme={createGa2Theme(props.pageProps.themeOptions)}
      defaultDescription={GA2_DEFAULT_DESCRIPTION}
      ensureEntitiesLoaded={ensureEntitiesLoaded}
    />
  );
}

export default MyApp;
