import "@databiosphere/findable-ui";
import { AzulEntitiesStaticResponse } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { Error } from "@databiosphere/findable-ui/lib/components/Error/error";
import { ErrorBoundary } from "@databiosphere/findable-ui/lib/components/ErrorBoundary";
import { Head } from "@databiosphere/findable-ui/lib/components/Head/head";
import { AppLayout as DXAppLayout } from "@databiosphere/findable-ui/lib/components/Layout/components/AppLayout/appLayout.styles";
import { Floating } from "@databiosphere/findable-ui/lib/components/Layout/components/Floating/floating";
import { Header as DXHeader } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/header";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main";
import { setFeatureFlags } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/common/utils";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { ConfigProvider as DXConfigProvider } from "@databiosphere/findable-ui/lib/providers/config";
import { ExploreStateProvider } from "@databiosphere/findable-ui/lib/providers/exploreState";

import { LayoutDimensionsProvider } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/provider";
import { ServicesProvider } from "@databiosphere/findable-ui/lib/providers/services/provider";
import { SystemStatusProvider } from "@databiosphere/findable-ui/lib/providers/systemStatus";
import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { JSX, useMemo } from "react";
import { BRC_DEFAULT_DESCRIPTION } from "../app/common/meta/brc/constants";
import { OgMeta } from "../app/components/common/OgMeta/ogMeta";
import { StyledFooter } from "../app/components/Layout/components/Footer/footer.styles";
import { config } from "../app/config/config";
import { BrcAuthProvider } from "../app/providers/authentication";
import { useEntities } from "../app/services/workflows/hooks/UseEntities/hook";
import "../app/styles/fonts/fonts.css";
import { mergeAppTheme } from "../app/theme/theme";
import { ROUTES } from "../routes/constants";
import { APP_KEYS } from "../site-config/common/constants";

const DEFAULT_ENTITY_LIST_TYPE = "organisms";

export interface PageProps extends AzulEntitiesStaticResponse {
  pageDescription?: string;
  pageTitle?: string;
}

export type NextPageWithComponent = NextPage & {
  AppLayout?: typeof DXAppLayout;
  Main?: typeof DXMain;
};

export type AppPropsWithComponent = AppProps & {
  Component: NextPageWithComponent;
  pageProps: PageProps;
};

setFeatureFlags(["assistant", "lmls"]);

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppPropsWithComponent): JSX.Element {
  // Set up the site configuration, layout and theme.
  const appConfig = config();
  // Load entities into the in-memory cache.
  const isEntitiesLoaded = useEntities();
  const {
    layout,
    redirectRootToPath,
    themeOptions: baseThemeOptions,
  } = appConfig;
  const { floating, footer, header } = layout || {};
  const {
    entityListType = DEFAULT_ENTITY_LIST_TYPE,
    pageDescription,
    pageTitle,
    themeOptions,
  } = pageProps;
  const appTheme = mergeAppTheme(baseThemeOptions, themeOptions);
  const AppLayout = Component.AppLayout || DXAppLayout;
  const Main = Component.Main || DXMain;
  const isAssistantEnabled = useFeatureFlag("assistant");
  const filteredHeader = useMemo(() => {
    if (!header) return header;
    if (isAssistantEnabled) return header;
    const { navigation, ...rest } = header;
    if (!navigation) return header;
    return {
      ...rest,
      navigation: navigation.map((group) =>
        group?.filter((item) => item.url !== ROUTES.ASSISTANT)
      ) as typeof navigation,
    };
  }, [header, isAssistantEnabled]);

  const isBRC = appConfig.appKey === APP_KEYS.BRC_ANALYTICS;
  const ogMeta = isBRC ? (
    <OgMeta
      appTitle={appConfig.appTitle}
      browserURL={appConfig.browserURL}
      defaultDescription={BRC_DEFAULT_DESCRIPTION}
      pageDescription={pageDescription}
      pageTitle={pageTitle}
    />
  ) : null;

  if (!isEntitiesLoaded) return <>{ogMeta}</>;

  return (
    <EmotionThemeProvider theme={appTheme}>
      <ThemeProvider theme={appTheme}>
        <DXConfigProvider config={appConfig} entityListType={entityListType}>
          <Head pageTitle={pageTitle} />
          {ogMeta}
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            <ServicesProvider>
              <SystemStatusProvider>
                <BrcAuthProvider loginEnabled={appConfig.loginEnabled}>
                  <LayoutDimensionsProvider>
                    <AppLayout>
                      <DXHeader {...filteredHeader} />
                      <ExploreStateProvider entityListType={entityListType}>
                        <Main>
                          <ErrorBoundary
                            fallbackRender={({
                              error,
                              reset,
                            }: {
                              error: DataExplorerError;
                              reset: () => void;
                            }): JSX.Element => (
                              <Error
                                errorMessage={error.message}
                                requestUrlMessage={error.requestUrlMessage}
                                rootPath={redirectRootToPath}
                                onReset={reset}
                              />
                            )}
                          >
                            <Component {...pageProps} />
                            <Floating {...floating} />
                          </ErrorBoundary>
                        </Main>
                      </ExploreStateProvider>
                      <StyledFooter {...footer} />
                    </AppLayout>
                  </LayoutDimensionsProvider>
                </BrcAuthProvider>
              </SystemStatusProvider>
            </ServicesProvider>
          </QueryClientProvider>
        </DXConfigProvider>
      </ThemeProvider>
    </EmotionThemeProvider>
  );
}

export default MyApp;
