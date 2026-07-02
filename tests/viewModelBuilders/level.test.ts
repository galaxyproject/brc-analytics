// buildLevel references component types only (erased at runtime); mock the
// component barrel so importing it doesn't pull untransformable MDX modules.
jest.mock("app/components", () => ({}));

import type { BRCDataCatalogGenome } from "../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { buildLevel } from "../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

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
