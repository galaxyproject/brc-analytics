import {
  getEntitiesById,
  getEntitiesByType,
  setEntitiesById,
  setEntitiesByType,
} from "../../app/services/workflows/store";
import { getEntities, getEntity } from "../../app/services/workflows/query";

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
});
