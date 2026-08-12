import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { EntitiesProvider } from "@repo/shared/providers/entities/provider";
import { type UseEntities } from "@repo/shared/services/workflows/hooks/UseEntities/types";
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

/**
 * Renders the gate under a provider carrying the given load state.
 * @param value - Entity cache load state.
 * @param fallback - Optional gate fallback.
 * @returns The render result.
 */
function renderGate(
  value: UseEntities,
  fallback?: ReactNode
): ReturnType<typeof render> {
  return render(
    <EntitiesProvider value={value}>
      <EntityDataGate fallback={fallback}>
        <div>content</div>
      </EntityDataGate>
    </EntitiesProvider>
  );
}

describe("EntityDataGate", () => {
  test("renders nothing while loading by default", () => {
    renderGate({ isLoaded: false });

    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the fallback while loading", () => {
    renderGate({ isLoaded: false }, <div>loading</div>);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children once loaded", () => {
    renderGate({ isLoaded: true });

    expect(screen.getByText("content")).toBeTruthy();
  });

  test("renders the error page on a failed load", () => {
    renderGate({
      error: new DataExplorerError(new Error("fetch failed")),
      isLoaded: false,
    });

    expect(screen.getByText("error page: fetch failed")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children when loaded, even if an error is also present", () => {
    renderGate({
      error: new DataExplorerError(new Error("fetch failed")),
      isLoaded: true,
    });

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("error page: fetch failed")).toBeNull();
  });
});
