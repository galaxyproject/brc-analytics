import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import {
  AppProviders,
  type AppPropsWithComponent,
} from "@repo/shared/components/layout/AppProviders/appProviders";
import { type AppSiteConfig } from "@repo/shared/config/types";
import { render, screen } from "@testing-library/react";
import { type JSX, type ReactNode } from "react";

// The shell's providers reach modules that import ky, an ESM-only package
// Jest can't parse. With login off nothing here makes a request.
jest.mock("ky", () => ({
  __esModule: true,
  default: {
    create: (): unknown => ({
      delete: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
    }),
  },
}));

// The emotion cache provider expects a real Pages router app; it isn't what
// this test is about.
jest.mock("@mui/material-nextjs/v16-pagesRouter", () => ({
  AppCacheProvider: ({ children }: { children: ReactNode }): ReactNode =>
    children,
}));

jest.mock("next/router", () => {
  const router = {
    asPath: "/",
    basePath: "",
    beforePopState: jest.fn(),
    events: { off: jest.fn(), on: jest.fn() },
    isReady: true,
    pathname: "/",
    push: jest.fn(),
    query: {},
    replace: jest.fn(),
  };
  return {
    __esModule: true,
    default: router,
    useRouter: (): typeof router => router,
  };
});

// jsdom has no ResizeObserver; the layout dimensions provider observes the
// header with one.
beforeAll(() => {
  global.ResizeObserver ??= class {
    disconnect(): void {}
    observe(): void {}
    unobserve(): void {}
  };
});

/**
 * A site config with no entity lists, the shape the Logan Search site has.
 * @returns the config.
 */
function noEntitySiteConfig(): AppSiteConfig {
  return {
    appTitle: "No Entities",
    browserURL: "http://localhost:3000",
    dataSource: { url: "" },
    entities: [],
    layout: {
      footer: {},
      header: { logo: null },
    },
    loginEnabled: false,
    maxReadRunsForBrowseAll: 0,
    redirectRootToPath: "/",
  } as unknown as AppSiteConfig;
}

/**
 * The page under the shell.
 * @returns a marker to find.
 */
function Page(): JSX.Element {
  return <p>page body</p>;
}

describe("AppProviders on a site with no entity lists", () => {
  test("renders the page when the default entity list type is empty", () => {
    const appProps = {
      Component: Page,
      pageProps: {},
    } as unknown as AppPropsWithComponent;

    render(
      <AppProviders
        appConfig={noEntitySiteConfig()}
        appProps={appProps}
        appTheme={createAppTheme()}
        defaultDescription="No entities here."
        defaultEntityListType=""
        ensureEntitiesLoaded={(): Promise<void> => Promise.resolve()}
      />
    );

    expect(screen.getByText("page body")).toBeTruthy();
  });
});
