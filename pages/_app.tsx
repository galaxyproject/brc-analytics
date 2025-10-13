import "@databiosphere/findable-ui";
import { AzulEntitiesStaticResponse } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { Error } from "@databiosphere/findable-ui/lib/components/Error/error";
import { ErrorBoundary } from "@databiosphere/findable-ui/lib/components/ErrorBoundary";
import { Head } from "@databiosphere/findable-ui/lib/components/Head/head";
import { AppLayout as DXAppLayout } from "@databiosphere/findable-ui/lib/components/Layout/components/AppLayout/appLayout.styles";
import { Floating } from "@databiosphere/findable-ui/lib/components/Layout/components/Floating/floating";
import { Header as DXHeader } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/header";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main";
import { ConfigProvider as DXConfigProvider } from "@databiosphere/findable-ui/lib/providers/config";
import { ExploreStateProvider } from "@databiosphere/findable-ui/lib/providers/exploreState";
import { LayoutDimensionsProvider } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/provider";
import { SystemStatusProvider } from "@databiosphere/findable-ui/lib/providers/systemStatus";
import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { StyledFooter } from "../app/components/Layout/components/Footer/footer.styles";
import { StyledPagesMain } from "../app/components/Layout/components/Main/main.styles";
import { config } from "../app/config/config";
import { mergeAppTheme } from "../app/theme/theme";
import { GoogleSignInAuthenticationProvider } from "@databiosphere/findable-ui/lib/providers/googleSignInAuthentication/provider";
import { ServicesProvider } from "@databiosphere/findable-ui/lib/providers/services/provider";
const DEFAULT_ENTITY_LIST_TYPE = "organisms";
import "../app/styles/fonts/fonts.css";

export interface PageProps extends AzulEntitiesStaticResponse {
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

function MyApp({ Component, pageProps }: AppPropsWithComponent): JSX.Element {
  // Set up the site configuration, layout and theme.
  const appConfig = config();
  const {
    layout,
    redirectRootToPath,
    themeOptions: baseThemeOptions,
  } = appConfig;
  const { floating, footer, header } = layout || {};
  const {
    entityListType = DEFAULT_ENTITY_LIST_TYPE,
    pageTitle,
    themeOptions,
  } = pageProps;
  const appTheme = mergeAppTheme(baseThemeOptions, themeOptions);
  const AppLayout = Component.AppLayout || DXAppLayout;
  const router = useRouter();
  const Main =
    Component.Main ||
    (router.pathname.startsWith("/learn") ? StyledPagesMain : DXMain);
  return (
    <EmotionThemeProvider theme={appTheme}>
      <ThemeProvider theme={appTheme}>
        <DXConfigProvider config={appConfig} entityListType={entityListType}>
          <Head pageTitle={pageTitle} />
          <CssBaseline />
          <ServicesProvider>
            <SystemStatusProvider>
              <GoogleSignInAuthenticationProvider>
                <LayoutDimensionsProvider>
                  <AppLayout>
                    <DXHeader {...header} />
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
              </GoogleSignInAuthenticationProvider>
            </SystemStatusProvider>
          </ServicesProvider>
        </DXConfigProvider>
      </ThemeProvider>
    </EmotionThemeProvider>
  );
}

export default MyApp;
