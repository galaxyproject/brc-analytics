import type { BRCDataCatalogGenome } from "@brc/apis/assembly";
import { buildLevel } from "@repo/shared/viewModelBuilders/viewModelBuilders";

describe("buildLevel", () => {
  test.each([
    ["Complete Genome", 4, "Genome"],
    ["Chromosome", 3, "Chromosome"],
    ["Scaffold", 2, "Scaffold"],
    ["Contig", 1, "Contig"],
  ])("maps %s to %i filled bars with label %s", (level, filled, label) => {
    expect(buildLevel({ level } as BRCDataCatalogGenome)).toEqual({
      filledCount: filled,
      label,
    });
  });

  test("unknown level resolves to zero filled bars and its raw label", () => {
    expect(
      buildLevel({ level: "Mystery" } as unknown as BRCDataCatalogGenome)
    ).toEqual({ filledCount: 0, label: "Mystery" });
  });
});
