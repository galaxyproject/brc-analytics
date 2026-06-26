// buildLevel references component types only (erased at runtime); mock the
// component barrel so importing it doesn't pull untransformable MDX modules.
jest.mock("app/components", () => ({}));

import type { BRCDataCatalogGenome } from "../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { buildLevel } from "../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

describe("buildLevel", () => {
  test.each([
    ["Complete Genome", 4],
    ["Chromosome", 3],
    ["Scaffold", 2],
    ["Contig", 1],
  ])("maps %s to %i filled bars with the level as label", (level, filled) => {
    expect(buildLevel({ level } as BRCDataCatalogGenome)).toEqual({
      filledCount: filled,
      label: level,
    });
  });

  test("unknown level resolves to zero filled bars", () => {
    expect(
      buildLevel({ level: "Mystery" } as unknown as BRCDataCatalogGenome)
    ).toEqual({ filledCount: 0, label: "Mystery" });
  });
});
