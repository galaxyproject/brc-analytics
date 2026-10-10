import { setFeatureFlags } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/common/utils";
import { config } from "@logan/config/config";
import { LOGAN_DEFAULT_DESCRIPTION } from "@logan/meta/constants";
import { createLoganTheme } from "@logan/theme/theme";
import {
  AppProviders,
  type AppPropsWithComponent,
} from "@repo/shared/components/layout/AppProviders/appProviders";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { type JSX } from "react";

setFeatureFlags([FEATURE_FLAGS.LOGAN_FILTERS]);

/**
 * The site has no catalog, so there is nothing to load before a page renders.
 * @returns a resolved promise.
 */
function ensureEntitiesLoaded(): Promise<void> {
  return Promise.resolve();
}

function MyApp(props: AppPropsWithComponent): JSX.Element {
  const appConfig = config();
  return (
    <AppProviders
      appConfig={appConfig}
      appProps={props}
      appTheme={createLoganTheme(props.pageProps.themeOptions)}
      defaultDescription={LOGAN_DEFAULT_DESCRIPTION}
      defaultEntityListType=""
      ensureEntitiesLoaded={ensureEntitiesLoaded}
    />
  );
}

export default MyApp;
