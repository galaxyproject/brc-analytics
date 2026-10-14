import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { Workflow } from "@repo/shared/apis/workflow";
import {
  createEntitiesLoader,
  loadEntities,
  loadWorkflows,
  settleAll,
} from "@repo/shared/services/workflows/loader";
import { API } from "@repo/shared/services/workflows/routes";
import {
  getEntitiesById,
  getEntitiesByType,
} from "@repo/shared/services/workflows/store";

const CONFIG = {
  entities: [{ getId, route: "assemblies" }],
} as SiteConfig;

const TWO_ROUTE_CONFIG = {
  entities: [
    { getId, route: "organisms" },
    { getId, route: "assemblies" },
  ],
} as SiteConfig;

describe("createEntitiesLoader", () => {
  const CONFIG = {} as SiteConfig;

  test("shares a single in-flight load across calls", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    const ensureLoaded = createEntitiesLoader(load);

    await Promise.all([ensureLoaded(CONFIG), ensureLoaded(CONFIG)]);
    await ensureLoaded(CONFIG);

    expect(load).toHaveBeenCalledTimes(1);
  });

  test("drops a rejected load so a later call re-attempts", async () => {
    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(undefined);
    const ensureLoaded = createEntitiesLoader(load);

    await expect(ensureLoaded(CONFIG)).rejects.toThrow("fetch failed");
    await expect(ensureLoaded(CONFIG)).resolves.toBeUndefined();

    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("settleAll", () => {
  test("resolves once every load succeeds", async () => {
    await expect(
      settleAll([Promise.resolve(), Promise.resolve()])
    ).resolves.toBeUndefined();
  });

  test("rejects with the first failure in order, only once every load has settled", async () => {
    let slowSettled = false;
    const slow = new Promise<void>((resolve) =>
      setTimeout(() => {
        slowSettled = true;
        resolve();
      }, 10)
    );

    await expect(
      settleAll([
        slow,
        Promise.reject(new Error("first")),
        Promise.reject(new Error("second")),
      ])
    ).rejects.toThrow("first");
    expect(slowSettled).toBe(true);
  });

  test("keeps a createEntitiesLoader load shared until every load has settled", async () => {
    let finishSlow = (): void => undefined;
    const slowLoad = jest.fn(
      () => new Promise<void>((resolve) => (finishSlow = resolve))
    );
    const ensureLoaded = createEntitiesLoader(() =>
      settleAll([slowLoad(), Promise.reject(new Error("fast failure"))])
    );
    const config = {} as SiteConfig;

    const first = ensureLoaded(config);
    // Let the fast failure land, then retry while the slow load is still
    // running: the retry joins the same load instead of starting the slow
    // load again.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const retry = ensureLoaded(config);
    finishSlow();

    expect(retry).toBe(first);
    await expect(first).rejects.toThrow("fast failure");
    expect(slowLoad).toHaveBeenCalledTimes(1);
  });
});

describe("workflows loader", () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    getEntitiesById().clear();
    getEntitiesByType().clear();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  describe("loadEntities", () => {
    test("skips routes not in API", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse());

      await loadEntities({
        entities: [{ getId, route: "not-a-valid-route" }],
      } as SiteConfig);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(getEntitiesById().size).toBe(0);
      expect(getEntitiesByType().size).toBe(0);
    });

    test("skips the workflows route, which loadWorkflows owns", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse());

      await loadEntities({
        entities: [{ getId, route: "workflows" }],
      } as SiteConfig);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(getEntitiesById().has("workflows")).toBe(false);
      expect(getEntitiesByType().has("workflows")).toBe(false);
    });

    test("skips entities when getId is not configured", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse());

      await loadEntities({ entities: [{ route: "assemblies" }] } as SiteConfig);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(getEntitiesById().has("assemblies")).toBe(false);
    });

    test("skips routes that are already loaded", async () => {
      const existing = new Map<string, unknown>();
      existing.set("asm1", { id: "asm1" });
      getEntitiesById().set("assemblies", existing);

      const payload = [{ id: "asm2" }];

      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse(payload));

      await loadEntities(CONFIG);

      // Should not re-fetch or overwrite existing entries.
      expect(fetchMock).not.toHaveBeenCalled();

      const byId = getEntitiesById().get("assemblies");
      expect(byId?.get("asm1")).toEqual({ id: "asm1" });
      expect(byId?.get("asm2")).toBeUndefined();
    });

    test("loads entities from API and populates store", async () => {
      const payload = [{ id: "asm1" }, { id: "asm2" }];

      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse(payload));

      await loadEntities(CONFIG);

      expect(fetchMock).toHaveBeenCalledWith(API.assemblies);

      const byId = getEntitiesById().get("assemblies");
      const byType = getEntitiesByType().get("assemblies");

      expect(byType).toEqual(payload);
      expect(byId?.get("asm1")).toEqual({ id: "asm1" });
      expect(byId?.get("asm2")).toEqual({ id: "asm2" });
    });

    test("throws when fetch fails", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse([], false));

      await expect(loadEntities(CONFIG)).rejects.toThrow(
        `Failed to fetch: ${API.assemblies}`
      );
    });

    test("fetches every entity list at once", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse());

      const loading = loadEntities(TWO_ROUTE_CONFIG);

      // Both fetches start before either resolves: a sequential load would
      // start the second only after awaiting the first.
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledWith(API.organisms);
      expect(fetchMock).toHaveBeenCalledWith(API.assemblies);

      await loading;

      expect(getEntitiesById().has("organisms")).toBe(true);
      expect(getEntitiesById().has("assemblies")).toBe(true);
    });

    test("fetches a route shared by two entity configs once, keyed by the first config with a getId", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse([{ id: "1", name: "a" }]));

      await loadEntities({
        entities: [
          { route: "assemblies" },
          { getId, route: "assemblies" },
          {
            getId: (e: { name: string }): string => e.name,
            route: "assemblies",
          },
        ],
      } as SiteConfig);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getEntitiesById().get("assemblies")?.has("1")).toBe(true);
    });

    test("fetches a list again after its load failed", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock
        .mockResolvedValueOnce(mockFetchResponse([], false))
        .mockResolvedValueOnce(mockFetchResponse());

      await expect(loadEntities(CONFIG)).rejects.toThrow(
        `Failed to fetch: ${API.assemblies}`
      );
      await loadEntities(CONFIG);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(getEntitiesById().get("assemblies")?.has("1")).toBe(true);
    });

    test("keeps the lists that loaded when another fetch fails", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockImplementation(async (url: string) => {
        if (url === API.assemblies) return mockFetchResponse([], false);
        // Organisms arrives after assemblies has already failed.
        await new Promise((resolve) => setTimeout(resolve, 10));
        return mockFetchResponse([{ id: "1" }]);
      });

      await expect(loadEntities(TWO_ROUTE_CONFIG)).rejects.toThrow(
        `Failed to fetch: ${API.assemblies}`
      );

      expect(getEntitiesById().get("organisms")?.has("1")).toBe(true);
      expect(getEntitiesById().has("assemblies")).toBe(false);
    });
  });

  describe("loadWorkflows", () => {
    test("loads workflow categories, flattens workflows, and populates store", async () => {
      const categories = [{ workflows: [{ trsId: "trs-1" }] }];
      const extraWorkflows = [{ trsId: "custom-workflow" } as Workflow];

      fetchMock.mockResolvedValue(mockFetchResponse(categories));

      await loadWorkflows(extraWorkflows);

      expect(fetchMock).toHaveBeenCalledWith(API.workflows);

      const byId = getEntitiesById().get("workflows");
      const byType = getEntitiesByType().get("workflows");

      expect(byType).toEqual(categories);

      expect(byId?.has("trs-1")).toBe(true);
      expect(byId?.has("custom-workflow")).toBe(true);
    });

    test("throws when a catalog and an extra workflow share a URL-formatted id", async () => {
      const categories = [{ workflows: [{ trsId: "#workflow/v0.1" }] }];
      const extraWorkflows = [{ trsId: "workflow-v0-1" } as Workflow];

      fetchMock.mockResolvedValue(mockFetchResponse(categories));

      await expect(loadWorkflows(extraWorkflows)).rejects.toThrow(
        'Workflows "#workflow/v0.1" and "workflow-v0-1" share the URL id "workflow-v0-1"'
      );
    });

    test("throws when workflow fetch fails", async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue(mockFetchResponse([], false));

      await expect(loadWorkflows()).rejects.toThrow(
        `Failed to fetch: ${API.workflows}`
      );
    });
  });
});

/**
 * Mocks the getId function.
 * @param e - Entity.
 * @returns Entity id.
 */
function getId<T extends { id: string }>(e: T): string {
  return e.id;
}

/**
 * Mocks the fetch response.
 * @param payload - Payload.
 * @param ok - OK.
 * @returns Fetch response.
 */
function mockFetchResponse(
  payload: unknown[] = [{ id: "1" }],
  ok = true
): Response {
  return { json: async () => payload, ok } as Response;
}
