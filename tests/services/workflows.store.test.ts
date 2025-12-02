import {
  getEntitiesById,
  getEntitiesByType,
  setEntitiesById,
  setEntitiesByType,
} from "../../app/services/workflows/store";

describe("workflows store", () => {
  beforeEach(() => {
    getEntitiesById().clear();
    getEntitiesByType().clear();
  });

  test("setEntitiesById and getEntitiesById store entities keyed by route", () => {
    const assemblies = new Map<string, unknown>();
    assemblies.set("asm1", { id: "asm1" });
    assemblies.set("asm2", { id: "asm2" });

    setEntitiesById("assemblies", assemblies);

    const byId = getEntitiesById();

    expect(byId.get("assemblies")?.get("asm1")).toEqual({ id: "asm1" });
    expect(byId.get("assemblies")?.get("asm2")).toEqual({ id: "asm2" });
  });

  test("setEntitiesByType and getEntitiesByType store entity arrays keyed by route", () => {
    const assemblies = [{ id: "asm1" }, { id: "asm2" }];

    setEntitiesByType("assemblies", assemblies);

    const byType = getEntitiesByType();

    expect(byType.get("assemblies")).toEqual(assemblies);
  });

  test("stores maintain independent entries for different routes", () => {
    const assemblies = new Map<string, unknown>();
    assemblies.set("asm1", { id: "asm1" });

    const workflows = new Map<string, unknown>();
    workflows.set("wf1", { id: "wf1" });

    setEntitiesById("assemblies", assemblies);
    setEntitiesById("workflows", workflows);

    const byId = getEntitiesById();

    expect(byId.get("assemblies")?.get("asm1")).toEqual({ id: "asm1" });
    expect(byId.get("workflows")?.get("wf1")).toEqual({ id: "wf1" });
  });
});
