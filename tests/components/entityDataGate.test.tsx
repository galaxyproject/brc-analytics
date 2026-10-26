import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { EntitiesProvider } from "@repo/shared/providers/entities/provider";
import {
  type EntityLoadStates,
  type UseEntities,
} from "@repo/shared/services/workflows/hooks/UseEntities/types";
import { type EntityRoute } from "@repo/shared/services/workflows/types";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";

jest.mock("@databiosphere/findable-ui/lib/config/config", () => ({
  getConfig: jest.fn().mockReturnValue({ redirectRootToPath: "/" }),
}));

// Stub the error page: it reads explore-state and layout contexts that are
// irrelevant to the gate's routing logic under test.
jest.mock("@databiosphere/findable-ui/lib/components/Error/error", () => ({
  Error: ({ errorMessage }: { errorMessage?: string }): unknown => (
    <div>error page: {errorMessage}</div>
  ),
}));

const FAILED = {
  error: new DataExplorerError(new Error("fetch failed")),
  isLoaded: false,
};

const LOADED = { isLoaded: true };

const LOADING = { isLoaded: false };

const NOT_STARTED: UseEntities = { isStarted: false, loadStates: {} };

describe("EntityDataGate", () => {
  test("renders nothing before the loader has run, by default", () => {
    renderGate(NOT_STARTED);

    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the fallback before the loader has run", () => {
    renderGate(NOT_STARTED, ["assemblies"], <div>loading</div>);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the fallback while a needed list is loading", () => {
    renderGate(
      started({ assemblies: LOADING }),
      ["assemblies"],
      <div>loading</div>
    );

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children once loaded", () => {
    renderGate(started({ assemblies: LOADED }));

    expect(screen.getByText("content")).toBeTruthy();
  });

  test("renders the error page on a failed load", () => {
    renderGate(started({ assemblies: FAILED }));

    expect(screen.getByText("error page: fetch failed")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("ignores lists the page doesn't read", () => {
    renderGate(
      started({ assemblies: LOADED, organisms: FAILED, workflows: LOADING })
    );

    expect(screen.getByText("content")).toBeTruthy();
  });

  test("waits while one needed list is still loading", () => {
    renderGate(
      started({ assemblies: LOADED, workflows: LOADING }),
      ["assemblies", "workflows"],
      <div>loading</div>
    );

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the error page when one needed list loaded and another failed", () => {
    renderGate(started({ assemblies: LOADED, workflows: FAILED }), [
      "assemblies",
      "workflows",
    ]);

    expect(screen.getByText("error page: fetch failed")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the error page when a needed list is still loading and another failed", () => {
    renderGate(started({ assemblies: LOADING, workflows: FAILED }), [
      "assemblies",
      "workflows",
    ]);

    expect(screen.getByText("error page: fetch failed")).toBeTruthy();
  });

  test("renders the error page for a needed list the loader never started", () => {
    renderGate(started({ workflows: LOADED }));

    expect(
      screen.getByText("error page: The assemblies list was not loaded.")
    ).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children for a page that reads no lists", () => {
    renderGate(started({}), []);

    expect(screen.getByText("content")).toBeTruthy();
  });
});

/**
 * Renders the gate under a provider carrying the given load state.
 * @param value - Entity load state.
 * @param routes - Entity lists the gated page reads.
 * @param fallback - Optional gate fallback.
 * @returns The render result.
 */
function renderGate(
  value: UseEntities,
  routes: EntityRoute[] = ["assemblies"],
  fallback?: ReactNode
): ReturnType<typeof render> {
  return render(
    <EntitiesProvider value={value}>
      <EntityDataGate fallback={fallback} routes={routes}>
        <div>content</div>
      </EntityDataGate>
    </EntitiesProvider>
  );
}

/**
 * Builds the load state of a loader that has run.
 * @param loadStates - Load state per entity list.
 * @returns Entity load state.
 */
function started(loadStates: EntityLoadStates): UseEntities {
  return { isStarted: true, loadStates };
}
