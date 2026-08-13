import { findWorkflow } from "@repo/shared/services/workflows/entities";
import { getEntities, getEntity } from "@repo/shared/services/workflows/query";
import {
  getEntitiesById,
  getEntitiesByType,
  setEntitiesById,
  setEntitiesByType,
} from "@repo/shared/services/workflows/store";

describe("workflows query", () => {
  beforeEach(() => {
    getEntitiesById().clear();
    getEntitiesByType().clear();
  });

  test("getEntities returns entities for given list type", () => {
    const assemblies = [{ id: "asm1" }, { id: "asm2" }];

    setEntitiesByType("assemblies", assemblies);

    expect(getEntities("assemblies")).toEqual(assemblies);
  });

  test("getEntities throws when no entities exist for list type", () => {
    expect(() => getEntities("assemblies")).toThrow(
      "No entities found for entity list type: assemblies"
    );
  });

  test("getEntity returns entity by id for given list type", () => {
    const assembliesMap = new Map<string, unknown>();
    assembliesMap.set("asm1", { id: "asm1" });

    setEntitiesById("assemblies", assembliesMap);

    expect(getEntity("assemblies", "asm1")).toEqual({ id: "asm1" });
  });

  test("getEntity throws when entity is not found", () => {
    const assembliesMap = new Map<string, unknown>();
    assembliesMap.set("asm1", { id: "asm1" });

    setEntitiesById("assemblies", assembliesMap);

    expect(() => getEntity("assemblies", "missing")).toThrow(
      "No entity found for entity list type: assemblies and entity id: missing"
    );
  });

  test("findWorkflow returns workflow by trs id", () => {
    const workflowsMap = new Map<string, unknown>();
    workflowsMap.set("workflow-id", { trsId: "workflow-id" });

    setEntitiesById("workflows", workflowsMap);

    expect(findWorkflow("workflow-id")).toEqual({ trsId: "workflow-id" });
  });

  test("findWorkflow returns undefined for an unknown trs id", () => {
    const workflowsMap = new Map<string, unknown>();
    workflowsMap.set("workflow-id", { trsId: "workflow-id" });

    setEntitiesById("workflows", workflowsMap);

    expect(findWorkflow("stale-workflow-id")).toBeUndefined();
  });
});
