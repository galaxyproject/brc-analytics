import { getDefaultDescription } from "@/common/meta/utils";
import { config } from "@/config/config";
import { useEntities } from "@/services/workflows/hooks/UseEntities/hook";
import "@/styles/fonts/fonts.css";
import { mergeAppTheme } from "@/theme/theme";
import { StyledFooter } from "@brc-analytics/core/components/Layout/components/Footer/footer.styles";
import { OgMeta } from "@brc-analytics/core/components/OgMeta/ogMeta";
import { EntitiesLoadedProvider } from "@brc-analytics/core/providers/entitiesLoaded/provider";
import { WorkflowHandoffProvider } from "@brc-analytics/core/providers/workflowHandoff/provider";
import { EntitiesResponse } from "@brc-analytics/core/services/staticGeneration/entities/types";
import "@databiosphere/findable-ui";
import { Error } from "@databiosphere/findable-ui/lib/components/Error/error";
import { ErrorBoundary } from "@databiosphere/findable-ui/lib/components/ErrorBoundary/errorBoundary";
import { Head } from "@databiosphere/findable-ui/lib/components/Head/head";
import { AppLayout as DXAppLayout } from "@databiosphere/findable-ui/lib/components/Layout/components/AppLayout/appLayout.styles";
import { Floating } from "@databiosphere/findable-ui/lib/components/Layout/components/Floating/floating";
import { Header as DXHeader } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/header";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main";
import { setFeatureFlags } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/common/utils";
import { ConfigProvider as DXConfigProvider } from "@databiosphere/findable-ui/lib/providers/config";
import { ExploreStateProvider } from "@databiosphere/findable-ui/lib/providers/exploreState";
import { LayoutDimensionsProvider } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/provider";
import { ServicesProvider } from "@databiosphere/findable-ui/lib/providers/services/provider";
import { SystemStatusProvider } from "@databiosphere/findable-ui/lib/providers/systemStatus";
import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { JSX } from "react";

// NOTE(#1419): config() still resolves via the shared NEXT_PUBLIC_SITE_CONFIG map during
// transition; removing that env mechanism (site imports its own config directly) is the
// cleanup ticket, not this structural batch. Imports of theme/styles/meta/services still
// resolve to the root app/ via the @/ alias until those move per-site in later increments.

const DEFAULT_ENTITY_LIST_TYPE = "organisms";

export interface PageProps {
  data?: EntitiesResponse<unknown>;
  entityListType?: string;
  pageDescription?: string;
  pageTitle?: string;
}

export type NextPageWithComponent = NextPage & {
  Main?: typeof DXMain;
};

export type AppPropsWithComponent = AppProps & {
  Component: NextPageWithComponent;
  pageProps: PageProps;
};

setFeatureFlags(["assembly-workflows", "hyphy"]);

const queryClient = new QueryClient();

function GA2App(props: AppPropsWithComponent): JSX.Element {
  const { Component, pageProps } = props;
  // Set up the site configuration, layout and theme.
  const appConfig = config();
  // Kick off entity cache load and distribute the boolean via context so
  // per-page EntityDataGate consumers share a single source of truth.
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
  const Main = Component.Main || DXMain;

  return (
    <AppCacheProvider {...props}>
      <EmotionThemeProvider theme={appTheme}>
        <ThemeProvider theme={appTheme}>
          <DXConfigProvider config={appConfig} entityListType={entityListType}>
            <Head pageTitle={pageTitle} />
            <OgMeta
              appTitle={appConfig.appTitle}
              browserURL={appConfig.browserURL}
              defaultDescription={getDefaultDescription(appConfig.appKey)}
              pageDescription={pageDescription}
              pageTitle={pageTitle}
            />
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
              <ServicesProvider>
                <SystemStatusProvider>
                  <LayoutDimensionsProvider>
                    <DXAppLayout>
                      <DXHeader {...header} />
                      <ExploreStateProvider entityListType={entityListType}>
                        <WorkflowHandoffProvider>
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
                              <EntitiesLoadedProvider value={isEntitiesLoaded}>
                                <Component {...pageProps} />
                                <Floating {...floating} />
                              </EntitiesLoadedProvider>
                            </ErrorBoundary>
                          </Main>
                        </WorkflowHandoffProvider>
                      </ExploreStateProvider>
                      <StyledFooter {...footer} />
                    </DXAppLayout>
                  </LayoutDimensionsProvider>
                </SystemStatusProvider>
              </ServicesProvider>
            </QueryClientProvider>
          </DXConfigProvider>
        </ThemeProvider>
      </EmotionThemeProvider>
    </AppCacheProvider>
  );
}

export default GA2App;
