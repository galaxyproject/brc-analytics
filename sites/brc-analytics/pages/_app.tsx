import { config } from "@brc/config/config";
import { BRC_DEFAULT_DESCRIPTION } from "@brc/meta/constants";
import { ensureEntitiesLoaded } from "@brc/services/workflows/hooks/UseEntities/utils";
import { createBrcTheme } from "@brc/theme/theme";
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
import { type DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider, type ThemeOptions } from "@mui/material";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import { StyledFooter } from "@repo/shared/components/layout/Footer/footer.styles";
import { OgMeta } from "@repo/shared/components/OgMeta/ogMeta";
import type { PageMeta } from "@repo/shared/meta/types";
import { AuthProvider } from "@repo/shared/providers/authentication/provider";
import { EntitiesLoadedProvider } from "@repo/shared/providers/entitiesLoaded/provider";
import { WorkflowHandoffProvider } from "@repo/shared/providers/workflowHandoff/provider";
import { useEntities } from "@repo/shared/services/workflows/hooks/UseEntities/hook";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type NextPage } from "next";
import type { AppProps } from "next/app";
import { type JSX } from "react";

const DEFAULT_ENTITY_LIST_TYPE = "organisms";

type PageProps = Partial<PageMeta> & {
  entityListType?: string;
  themeOptions?: ThemeOptions;
};

export type NextPageWithComponent = NextPage & {
  AppLayout?: typeof DXAppLayout;
  Main?: typeof DXMain;
};

export type AppPropsWithComponent = AppProps & {
  Component: NextPageWithComponent;
  pageProps: PageProps;
};

setFeatureFlags(["assembly-workflows", "hyphy", "lmls", "pangenome"]);

const queryClient = new QueryClient();

function MyApp(props: AppPropsWithComponent): JSX.Element {
  const { Component, pageProps } = props;
  // Set up the site configuration, layout and theme.
  const appConfig = config();
  // Kick off entity cache load and distribute the boolean via context so
  // per-page EntityDataGate consumers share a single source of truth.
  const isEntitiesLoaded = useEntities(ensureEntitiesLoaded);
  const { layout, redirectRootToPath } = appConfig;
  const { floating, footer, header } = layout || {};
  const {
    entityListType = DEFAULT_ENTITY_LIST_TYPE,
    pageDescription,
    pageTitle,
    themeOptions,
  } = pageProps;
  const appTheme = createBrcTheme(themeOptions);
  const AppLayout = Component.AppLayout || DXAppLayout;
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
              defaultDescription={BRC_DEFAULT_DESCRIPTION}
              pageDescription={pageDescription}
              pageTitle={pageTitle}
            />
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
              <ServicesProvider>
                <SystemStatusProvider>
                  <AuthProvider loginEnabled={appConfig.loginEnabled}>
                    <LayoutDimensionsProvider>
                      <AppLayout>
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
                  </AuthProvider>
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
