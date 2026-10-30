import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { Workflow } from "@repo/shared/apis/workflow";
import {
  loadEntityList,
  loadWorkflows,
} from "@repo/shared/services/workflows/loader";
import { API } from "@repo/shared/services/workflows/routes";
import {
  getEntitiesById,
  getEntitiesByType,
} from "@repo/shared/services/workflows/store";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";

const CONFIG = {
  entities: [{ getId, route: "assemblies" }],
} as SiteConfig;

describe("workflows loader", () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    getEntitiesById().clear();
    getEntitiesByType().clear();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  describe("loadEntityList", () => {
    test("loads entities from API and populates the store", async () => {
      const payload = [{ id: "asm1" }, { id: "asm2" }];

      fetchMock.mockResolvedValue(mockFetchResponse(payload));

      await loadEntityList("assemblies", CONFIG);

      expect(fetchMock).toHaveBeenCalledWith(API.assemblies);

      const byId = getEntitiesById().get("assemblies");
      const byType = getEntitiesByType().get("assemblies");

      expect(byType).toEqual(payload);
      expect(byId?.get("asm1")).toEqual({ id: "asm1" });
      expect(byId?.get("asm2")).toEqual({ id: "asm2" });
    });

    test("skips a list already loaded", async () => {
      const existing = new Map<string, unknown>();
      existing.set("asm1", { id: "asm1" });
      getEntitiesById().set("assemblies", existing);

      fetchMock.mockResolvedValue(mockFetchResponse([{ id: "asm2" }]));

      await loadEntityList("assemblies", CONFIG);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(getEntitiesById().get("assemblies")?.get("asm2")).toBeUndefined();
    });

    test("throws for a list the site doesn't configure", async () => {
      await expect(loadEntityList("organisms", CONFIG)).rejects.toThrow(
        "The organisms list is not configured."
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });

    test("throws for a list configured without getId", async () => {
      await expect(
        loadEntityList("assemblies", {
          entities: [{ route: "assemblies" }],
        } as SiteConfig)
      ).rejects.toThrow("The assemblies list is not configured.");

      expect(fetchMock).not.toHaveBeenCalled();
    });

    test("throws when fetch fails", async () => {
      fetchMock.mockResolvedValue(mockFetchResponse([], false));

      await expect(loadEntityList("assemblies", CONFIG)).rejects.toThrow(
        `Failed to fetch: ${API.assemblies}`
      );
      expect(getEntitiesById().has("assemblies")).toBe(false);
    });

    test("loads workflows with the custom workflow added, without an entity config", async () => {
      const categories = [{ workflows: [{ trsId: "trs-1" }] }];

      fetchMock.mockResolvedValue(mockFetchResponse(categories));

      await loadEntityList("workflows", {
        entities: [],
      } as unknown as SiteConfig);

      expect(fetchMock).toHaveBeenCalledWith(API.workflows);
      expect(getEntitiesByType().get("workflows")).toEqual(categories);

      const byId = getEntitiesById().get("workflows");
      expect(byId?.has("trs-1")).toBe(true);
      expect(byId?.has(CUSTOM_WORKFLOW.trsId)).toBe(true);
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
