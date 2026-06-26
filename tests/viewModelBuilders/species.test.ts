// The builders reference component types only (erased at runtime); mock the
// component barrel so importing it doesn't pull untransformable MDX modules.
jest.mock("app/components", () => ({}));

import type { BRCDataCatalogGenome } from "../../app/apis/catalog/brc-analytics-catalog/common/entities";
import type { GA2AssemblyEntity } from "../../app/apis/catalog/ga2/entities";
import { buildGenomeSpecies } from "../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { buildAssemblySpecies } from "../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";

describe("buildGenomeSpecies", () => {
  test("surfaces species, taxonomy id and all populated minor fields", () => {
    const genome = {
      ncbiTaxonomyId: "208964",
      priority: "CRITICAL",
      priorityPathogenName: "Pseudomonas aeruginosa",
      speciesTaxonomyId: "287",
      strainName: "PAO1",
      taxonomicGroup: ["Bacteria", "Proteobacteria"],
      taxonomicLevelIsolate: "ISO-1",
      taxonomicLevelSerotype: "O1",
      taxonomicLevelSpecies: "Pseudomonas aeruginosa",
      taxonomicLevelStrain: "PAO1",
    } as unknown as BRCDataCatalogGenome;

    const props = buildGenomeSpecies(genome);

    expect(props.species.label).toBe("Pseudomonas aeruginosa");
    expect(props.species.url).toBe("/data/organisms/287");
    expect(props.ncbiTaxonomyId).toBe("208964");
    expect(props.tags).toEqual([
      { label: "strain", value: "PAO1" },
      { label: "serotype", value: "O1" },
      { label: "isolate", value: "ISO-1" },
      { label: "group", value: "Bacteria, Proteobacteria" },
      {
        color: "warning",
        label: "priority",
        tooltip: "Pseudomonas aeruginosa",
        value: "critical",
      },
    ]);
  });

  test("omits unpopulated minor fields", () => {
    const genome = {
      ncbiTaxonomyId: "5833",
      speciesTaxonomyId: "5833",
      strainName: "",
      taxonomicGroup: [],
      taxonomicLevelIsolate: "None",
      taxonomicLevelSerotype: "None",
      taxonomicLevelSpecies: "Plasmodium falciparum",
      taxonomicLevelStrain: "None",
    } as unknown as BRCDataCatalogGenome;

    const props = buildGenomeSpecies(genome);

    expect(props.species.label).toBe("Plasmodium falciparum");
    expect(props.ncbiTaxonomyId).toBe("5833");
    expect(props.tags).toEqual([]);
  });
});

describe("buildAssemblySpecies", () => {
  test("surfaces species, taxonomy id and populated strain / taxonomic group", () => {
    const assembly = {
      ncbiTaxonomyId: "9606",
      speciesTaxonomyId: "9606",
      strainName: "",
      taxonomicGroup: ["Vertebrates"],
      taxonomicLevelSpecies: "Homo sapiens",
      taxonomicLevelStrain: "GRCh38",
    } as unknown as GA2AssemblyEntity;

    const props = buildAssemblySpecies(assembly);

    expect(props.species.label).toBe("Homo sapiens");
    expect(props.species.url).toBe("/data/organisms/9606");
    expect(props.ncbiTaxonomyId).toBe("9606");
    expect(props.tags).toEqual([
      { label: "strain", value: "GRCh38" },
      { label: "group", value: "Vertebrates" },
    ]);
  });

  test("omits unpopulated minor fields", () => {
    const assembly = {
      ncbiTaxonomyId: "7227",
      speciesTaxonomyId: "7227",
      strainName: "",
      taxonomicGroup: [],
      taxonomicLevelSpecies: "Drosophila melanogaster",
      taxonomicLevelStrain: "None",
    } as unknown as GA2AssemblyEntity;

    const props = buildAssemblySpecies(assembly);

    expect(props.tags).toEqual([]);
  });
});
