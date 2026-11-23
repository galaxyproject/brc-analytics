import {
  getEntitiesById,
  getEntitiesByType,
  setEntitiesByType,
} from "@repo/shared/services/workflows/store";
import { useEntitiesData } from "@repo/shared/views/EntitiesView/hooks/UseEntitiesData/hook";
import { getEntitiesData } from "@repo/shared/views/EntitiesView/utils";
import { renderHook } from "@testing-library/react";

const ASSEMBLIES = [{ id: "asm1" }, { id: "asm2" }];
const ORGANISMS = [{ id: "org1" }];

describe("EntitiesView", () => {
  beforeEach(() => {
    getEntitiesById().clear();
    getEntitiesByType().clear();
    setEntitiesByType("assemblies", ASSEMBLIES);
    setEntitiesByType("organisms", ORGANISMS);
  });

  describe("getEntitiesData", () => {
    it("returns the stored entities as a copy of the store's array", () => {
      const data = getEntitiesData("assemblies");

      expect(data).toEqual(ASSEMBLIES);
      expect(data).not.toBe(getEntitiesByType().get("assemblies"));
    });

    it("throws for an entity list type with no stored entities", () => {
      expect(() => getEntitiesData("genes")).toThrow(
        "No entities found for entity list type: genes"
      );
    });
  });

  describe("useEntitiesData", () => {
    it("keeps the same array across re-renders for the same entity list type", () => {
      const { rerender, result } = renderHook(
        ({ entityListType }) => useEntitiesData(entityListType),
        { initialProps: { entityListType: "assemblies" } }
      );
      const first = result.current;

      rerender({ entityListType: "assemblies" });

      expect(result.current).toBe(first);
    });

    it("returns the new list's entities when the entity list type changes", () => {
      const { rerender, result } = renderHook(
        ({ entityListType }) => useEntitiesData(entityListType),
        { initialProps: { entityListType: "assemblies" } }
      );

      rerender({ entityListType: "organisms" });

      expect(result.current).toEqual(ORGANISMS);
    });
  });
});
