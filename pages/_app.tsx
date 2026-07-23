import { AzulEntitiesStaticResponse } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { Error } from "@databiosphere/findable-ui/lib/components/Error/error";
import { ErrorBoundary } from "@databiosphere/findable-ui/lib/components/ErrorBoundary/errorBoundary";
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
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { JSX, useMemo } from "react";
import { getDefaultDescription } from "../app/common/meta/utils";
import { OgMeta } from "../app/components/common/OgMeta/ogMeta";
import { StyledFooter } from "../app/components/Layout/components/Footer/footer.styles";
import { config } from "../app/config/config";
import { BrcAuthProvider } from "../app/providers/authentication";
import { EntitiesLoadedProvider } from "../app/providers/entitiesLoaded/provider";
import { WorkflowHandoffProvider } from "../app/providers/workflowHandoff/provider";
import { useEntities } from "../app/services/workflows/hooks/UseEntities/hook";
import "../app/styles/fonts/fonts.css";
import { mergeAppTheme } from "../app/theme/theme";
import { ROUTES } from "../routes/constants";

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

setFeatureFlags([
  "assembly-workflows",
  "assistant",
  "hyphy",
  "lmls",
  "pangenome",
]);

const queryClient = new QueryClient();

function MyApp(props: AppPropsWithComponent): JSX.Element {
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
                  <BrcAuthProvider loginEnabled={appConfig.loginEnabled}>
                    <LayoutDimensionsProvider>
                      <AppLayout>
                        <DXHeader {...filteredHeader} />
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
                                <EntitiesLoadedProvider
                                  value={isEntitiesLoaded}
                                >
                                  <Component {...pageProps} />
                                  <Floating {...floating} />
                                </EntitiesLoadedProvider>
                              </ErrorBoundary>
                            </Main>
                          </WorkflowHandoffProvider>
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
    </AppCacheProvider>
  );
}

export default MyApp;
