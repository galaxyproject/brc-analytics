import { setFeatureFlags } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/common/utils";
import { config } from "@logan/config/config";
import { withMySearches } from "@logan/config/navigation";
import { LOGAN_DEFAULT_DESCRIPTION } from "@logan/meta/constants";
import { createLoganTheme } from "@logan/theme/theme";
import {
  AppProviders,
  type AppPropsWithComponent,
} from "@repo/shared/components/layout/AppProviders/appProviders";
import { useRecentSearches } from "@repo/shared/components/LoganSearch/LoganSearchHistory/useRecentSearches";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { useMemo, type JSX } from "react";

setFeatureFlags([FEATURE_FLAGS.LOGAN_FILTERS]);

function MyApp(props: AppPropsWithComponent): JSX.Element {
  // Read after mount, so the static render and the first client render both
  // leave My searches out of the header.
  const { searches } = useRecentSearches();
  const appConfig = useMemo(
    () => withMySearches(config(), searches.length),
    [searches.length]
  );
  return (
    <AppProviders
      appConfig={appConfig}
      appProps={props}
      appTheme={createLoganTheme(props.pageProps.themeOptions)}
      defaultDescription={LOGAN_DEFAULT_DESCRIPTION}
      defaultEntityListType=""
    />
  );
}

export default MyApp;
