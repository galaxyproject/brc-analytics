// The builders reference component types only (erased at runtime); mock the
// component barrel so importing it doesn't pull untransformable MDX modules.
jest.mock("app/components", () => ({}));

import type { BRCDataCatalogGenome } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import type { GA2AssemblyEntity } from "@/apis/catalog/ga2/entities";
import {
  buildGenomeSpecies,
  buildOrganismGenomeSpecies,
} from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import {
  buildAssemblySpecies,
  buildOrganismAssemblySpecies,
} from "@/viewModelBuilders/catalog/ga2/viewModelBuilders";

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
      { label: "strain", tooltip: "PAO1", value: "PAO1" },
      { label: "serotype", tooltip: "O1", value: "O1" },
      { label: "isolate", tooltip: "ISO-1", value: "ISO-1" },
      {
        label: "group",
        tooltip: "Bacteria, Proteobacteria",
        value: "Bacteria, Proteobacteria",
      },
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
      { label: "strain", tooltip: "GRCh38", value: "GRCh38" },
      { label: "group", tooltip: "Vertebrates", value: "Vertebrates" },
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

describe("organism detail species cell (accession primary, no self-link)", () => {
  test("buildOrganismGenomeSpecies uses the accession as an unlinked label, keeps per-assembly tags", () => {
    const genome = {
      accession: "GCF_000002765.6",
      ncbiTaxonomyId: "5833",
      speciesTaxonomyId: "5833",
      strainName: "3D7",
      taxonomicGroup: [],
      taxonomicLevelIsolate: "None",
      taxonomicLevelSerotype: "None",
      taxonomicLevelSpecies: "Plasmodium falciparum",
      taxonomicLevelStrain: "3D7",
    } as unknown as BRCDataCatalogGenome;

    const props = buildOrganismGenomeSpecies(genome);

    expect(props.species.label).toBe("GCF_000002765.6");
    expect(props.species.url).toBe("");
    expect(props.tags).toEqual([
      { label: "strain", tooltip: "3D7", value: "3D7" },
    ]);
  });

  test("buildOrganismAssemblySpecies uses the accession as an unlinked label and drops the organism-scoped group tag", () => {
    const assembly = {
      accession: "GCF_000001405.40",
      ncbiTaxonomyId: "9606",
      speciesTaxonomyId: "9606",
      strainName: "",
      taxonomicGroup: ["Vertebrates"],
      taxonomicLevelSpecies: "Homo sapiens",
      taxonomicLevelStrain: "GRCh38",
    } as unknown as GA2AssemblyEntity;

    const props = buildOrganismAssemblySpecies(assembly);

    expect(props.species.label).toBe("GCF_000001405.40");
    expect(props.species.url).toBe("");
    expect(props.tags).toEqual([
      { label: "strain", tooltip: "GRCh38", value: "GRCh38" },
    ]);
  });
});
