import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { loadEntityList } from "@repo/shared/services/workflows/loader";
import { type EntityRoute } from "@repo/shared/services/workflows/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";

jest.mock("@databiosphere/findable-ui/lib/config/config", () => ({
  getConfig: jest
    .fn()
    .mockReturnValue({ entities: [], redirectRootToPath: "/" }),
}));

jest.mock("@repo/shared/services/workflows/loader", () => ({
  loadEntityList: jest.fn(),
}));

// Stub the error page: it reads explore-state and layout contexts that are
// irrelevant to the gate's routing logic under test.
jest.mock("@databiosphere/findable-ui/lib/components/Error/error", () => ({
  Error: ({ errorMessage }: { errorMessage?: string }): unknown => (
    <div>error page: {errorMessage}</div>
  ),
}));

const mockLoadEntityList = loadEntityList as jest.MockedFunction<
  typeof loadEntityList
>;

const LOADING = new Promise<void>(() => {});

describe("EntityDataGate", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient();
    // Silence the load-failure diagnostic logged for rejection tests.
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders nothing while loading, by default", () => {
    loadLists({ assemblies: LOADING });

    renderGate(queryClient);

    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the fallback while a needed list is loading", () => {
    loadLists({ assemblies: LOADING });

    renderGate(queryClient, ["assemblies"], <div>loading</div>);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children once loaded", async () => {
    loadLists({ assemblies: Promise.resolve() });

    renderGate(queryClient);

    expect(await screen.findByText("content")).toBeTruthy();
  });

  test("renders the error page on a failed load", async () => {
    loadLists({ assemblies: Promise.reject(new Error("fetch failed")) });

    renderGate(queryClient);

    expect(await screen.findByText("error page: fetch failed")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("loads only the lists the page reads", async () => {
    loadLists({ assemblies: Promise.resolve() });

    renderGate(queryClient);

    await screen.findByText("content");
    expect(mockLoadEntityList).toHaveBeenCalledTimes(1);
    expect(mockLoadEntityList.mock.calls[0][0]).toBe("assemblies");
  });

  test("waits while one needed list is still loading", async () => {
    loadLists({ assemblies: Promise.resolve(), workflows: LOADING });

    renderGate(queryClient, ["assemblies", "workflows"], <div>loading</div>);

    await waitForList(queryClient, "assemblies");
    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the error page when one needed list loaded and another failed", async () => {
    loadLists({
      assemblies: Promise.resolve(),
      workflows: Promise.reject(new Error("fetch failed")),
    });

    renderGate(queryClient, ["assemblies", "workflows"]);

    expect(await screen.findByText("error page: fetch failed")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children for a page that reads no lists", () => {
    renderGate(queryClient, []);

    expect(screen.getByText("content")).toBeTruthy();
    expect(mockLoadEntityList).not.toHaveBeenCalled();
  });

  test("doesn't load a list again for a later page that reads it", async () => {
    loadLists({ assemblies: Promise.resolve() });

    renderGate(queryClient).unmount();
    await waitForList(queryClient, "assemblies");
    renderGate(queryClient);

    expect(screen.getByText("content")).toBeTruthy();
    expect(mockLoadEntityList).toHaveBeenCalledTimes(1);
  });

  test("loads a failed list again for a later page that reads it", async () => {
    mockLoadEntityList
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce();

    const { unmount } = renderGate(queryClient);
    await screen.findByText("error page: fetch failed");
    unmount();
    renderGate(queryClient);

    expect(await screen.findByText("content")).toBeTruthy();
    expect(mockLoadEntityList).toHaveBeenCalledTimes(2);
  });
});

/**
 * Makes each entity list's load return the given promise.
 * @param loads - Load promise per entity list.
 */
function loadLists(loads: Partial<Record<EntityRoute, Promise<void>>>): void {
  mockLoadEntityList.mockImplementation(
    (route) => loads[route] ?? Promise.reject(new Error(`unexpected ${route}`))
  );
}

/**
 * Renders the gate under a query client.
 * @param queryClient - Query client.
 * @param routes - Entity lists the gated page reads.
 * @param fallback - Optional gate fallback.
 * @returns The render result.
 */
function renderGate(
  queryClient: QueryClient,
  routes: EntityRoute[] = ["assemblies"],
  fallback?: ReactNode
): ReturnType<typeof render> {
  return render(
    <QueryClientProvider client={queryClient}>
      <EntityDataGate fallback={fallback} routes={routes}>
        <div>content</div>
      </EntityDataGate>
    </QueryClientProvider>
  );
}

/**
 * Waits for an entity list's query to succeed.
 * @param queryClient - Query client.
 * @param route - Entity list.
 * @returns Promise that resolves once the list's query has succeeded.
 */
async function waitForList(
  queryClient: QueryClient,
  route: EntityRoute
): Promise<void> {
  while (queryClient.getQueryState(["entityList", route])?.status !== "success")
    await new Promise((resolve) => setTimeout(resolve, 0));
}
