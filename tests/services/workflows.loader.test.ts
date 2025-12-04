import { API } from "../../app/services/workflows/routes";
import {
  getEntitiesById,
  getEntitiesByType,
} from "../../app/services/workflows/store";
import {
  loadEntities,
  loadWorkflows,
} from "../../app/services/workflows/loader";
import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";

const CONFIG = {
  entities: [{ getId, route: "assemblies" }],
} as SiteConfig;

jest.mock(
  "../../app/components/Entity/components/AnalysisMethodsCatalog/utils",
  () => ({ formatTrsId: (trsId: string): string => trsId })
);

jest.mock(
  "../../app/components/Entity/components/AnalysisMethod/components/CustomWorkflow/constants",
  () => ({ CUSTOM_WORKFLOW: { trsId: "custom-workflow" } })
);

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
  });

  describe("loadWorkflows", () => {
    test("loads workflow categories, flattens workflows, and populates store", async () => {
      const categories = [{ workflows: [{ trsId: "trs-1" }] }];

      fetchMock.mockResolvedValue(mockFetchResponse(categories));

      await loadWorkflows();

      expect(fetchMock).toHaveBeenCalledWith(API.workflows);

      const byId = getEntitiesById().get("workflows");
      const byType = getEntitiesByType().get("workflows");

      expect(byType).toEqual(categories);

      expect(byId?.has("trs-1")).toBe(true);
      expect(byId?.has("custom-workflow")).toBe(true);
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
