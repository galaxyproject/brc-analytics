import { Error } from "@databiosphere/findable-ui/lib/components/Error/error";
import { ErrorBoundary } from "@databiosphere/findable-ui/lib/components/ErrorBoundary/errorBoundary";
import { Head } from "@databiosphere/findable-ui/lib/components/Head/head";
import { AppLayout as DXAppLayout } from "@databiosphere/findable-ui/lib/components/Layout/components/AppLayout/appLayout.styles";
import { Floating } from "@databiosphere/findable-ui/lib/components/Layout/components/Floating/floating";
import { Header as DXHeader } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/header";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main";
import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { ConfigProvider as DXConfigProvider } from "@databiosphere/findable-ui/lib/providers/config";
import { ExploreStateProvider } from "@databiosphere/findable-ui/lib/providers/exploreState";
import { LayoutDimensionsProvider } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/provider";
import { ServicesProvider } from "@databiosphere/findable-ui/lib/providers/services/provider";
import { SystemStatusProvider } from "@databiosphere/findable-ui/lib/providers/systemStatus";
import { type DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import {
  CssBaseline,
  ThemeProvider,
  type Theme,
  type ThemeOptions,
} from "@mui/material";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import { StyledFooter } from "@repo/shared/components/layout/Footer/footer.styles";
import { OgMeta } from "@repo/shared/components/OgMeta/ogMeta";
import type { PageMeta } from "@repo/shared/meta/types";
import { AuthProvider } from "@repo/shared/providers/authentication/provider";
import { EntitiesLoadedProvider } from "@repo/shared/providers/entitiesLoaded/provider";
import { WorkflowHandoffProvider } from "@repo/shared/providers/workflowHandoff/provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type NextPage } from "next";
import type { AppProps } from "next/app";
import { type JSX } from "react";

const DEFAULT_ENTITY_LIST_TYPE = "organisms";

const queryClient = new QueryClient();

export type NextPageWithComponent = NextPage & {
  AppLayout?: typeof DXAppLayout;
  Main?: typeof DXMain;
};

export type SitePageProps = Partial<PageMeta> & {
  entityListType?: string;
  themeOptions?: ThemeOptions;
};

export type AppPropsWithComponent = AppProps & {
  Component: NextPageWithComponent;
  pageProps: SitePageProps;
};

export interface AppProvidersProps {
  appConfig: SiteConfig;
  appProps: AppPropsWithComponent;
  appTheme: Theme;
  defaultDescription: string;
  isEntitiesLoaded: boolean;
  loginEnabled?: boolean;
}

/**
 * Site-agnostic application shell: wires up the theme, config, data and layout
 * providers around the active page. Each site resolves its own config, theme,
 * default description and entity-loaded state and passes them in.
 * @param props - Component props.
 * @param props.appConfig - Active site config.
 * @param props.appProps - Next.js app props (Component + pageProps).
 * @param props.appTheme - Resolved MUI/Emotion theme.
 * @param props.defaultDescription - Fallback OG description for the site.
 * @param props.isEntitiesLoaded - Whether the entity cache has loaded.
 * @param props.loginEnabled - Whether authentication is enabled for the site.
 * @returns the application shell.
 */
export function AppProviders({
  appConfig,
  appProps,
  appTheme,
  defaultDescription,
  isEntitiesLoaded,
  loginEnabled,
}: AppProvidersProps): JSX.Element {
  const { Component, pageProps } = appProps;
  const { layout, redirectRootToPath } = appConfig;
  const { floating, footer, header } = layout || {};
  const {
    entityListType = DEFAULT_ENTITY_LIST_TYPE,
    pageDescription,
    pageTitle,
  } = pageProps;
  const AppLayout = Component.AppLayout || DXAppLayout;
  const Main = Component.Main || DXMain;

  return (
    <AppCacheProvider {...appProps}>
      <EmotionThemeProvider theme={appTheme}>
        <ThemeProvider theme={appTheme}>
          <DXConfigProvider config={appConfig} entityListType={entityListType}>
            <Head pageTitle={pageTitle} />
            <OgMeta
              appTitle={appConfig.appTitle}
              browserURL={appConfig.browserURL}
              defaultDescription={defaultDescription}
              pageDescription={pageDescription}
              pageTitle={pageTitle}
            />
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
              <ServicesProvider>
                <SystemStatusProvider>
                  <AuthProvider loginEnabled={loginEnabled}>
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
