import { type BRCDataCatalogGenome } from "@brc/apis/assembly";
import {
  buildAssemblyJsonLd,
  buildDescription,
  parseVersion,
  serializeJsonLd,
  shouldPublishDatasetRecords,
} from "@brc/views/EntityView/assembly/components/AssemblyJsonLd/utils";
import { ORGANISM_PLOIDY } from "@repo/shared/apis/schema-types";

const APP_TITLE = "BRC Analytics";
const BROWSER_URL = "https://brc-analytics.org";

// Trichomonas vaginalis G3, as the catalog has it: no chromosome count, and
// "None" for its kingdom.
const ASSEMBLY: BRCDataCatalogGenome = {
  accession: "GCA_000002825.3",
  annotationStatus: null,
  chromosomes: null,
  coverage: "7.2",
  galaxyDatacacheUrl:
    "http://datacache.galaxyproject.org/brc/data/genomes/GCA_000002825.3/",
  gcPercent: 33,
  geneModelUrl:
    "https://hgdownload.soe.ucsc.edu/hubs/GCA/000/002/825/GCA_000002825.3/genes/GCA_000002825.3_ASM282v3.ncbiGene.gtf.gz",
  isRef: "No",
  length: 176420065,
  level: "Scaffold",
  lineageTaxonomyIds: [
    "1",
    "131567",
    "2759",
    "2611341",
    "5719",
    "37104",
    "181550",
    "5721",
    "5722",
    "412133",
  ],
  ncbiTaxonomyId: "412133",
  otherNames: ["Trichomonas vaginalis strain G3", "Tritrichomonas vaginalis"],
  otherTaxa: null,
  ploidy: [ORGANISM_PLOIDY.HAPLOID],
  priority: null,
  priorityPathogenName: null,
  releaseDate: "2022-12-02",
  scaffoldCount: 64769,
  scaffoldL50: 1020,
  scaffoldN50: 27122,
  speciesTaxonomyId: "5722",
  strainName: "G3",
  taxonomicGroup: ["Metamonada"],
  taxonomicLevelClass: "None",
  taxonomicLevelDomain: "Eukaryota",
  taxonomicLevelFamily: "Trichomonadidae",
  taxonomicLevelGenus: "Trichomonas",
  taxonomicLevelIsolate: "Trichomonas vaginalis G3",
  taxonomicLevelKingdom: "None",
  taxonomicLevelOrder: "Trichomonadida",
  taxonomicLevelPhylum: "Parabasalia",
  taxonomicLevelRealm: "None",
  taxonomicLevelSerotype: "None",
  taxonomicLevelSpecies: "Trichomonas vaginalis",
  taxonomicLevelStrain: "Trichomonas vaginalis strain G3",
  ucscBrowserUrl: "https://genome.ucsc.edu/h/GCA_000002825.3",
};

/**
 * Builds the Dataset record for the given assembly.
 * @param assembly - Assembly.
 * @returns The record.
 */
function build(
  assembly: BRCDataCatalogGenome
): ReturnType<typeof buildAssemblyJsonLd> {
  return buildAssemblyJsonLd(assembly, BROWSER_URL, APP_TITLE);
}

describe("buildAssemblyJsonLd", () => {
  it("builds the Dataset record for an assembly", () => {
    expect(build(ASSEMBLY)).toStrictEqual({
      "@context": "https://schema.org",
      "@type": "Dataset",
      creator: { "@type": "Organization", name: APP_TITLE, url: BROWSER_URL },
      datePublished: "2022-12-02",
      description:
        "Genome assembly GCA_000002825.3 of Trichomonas vaginalis G3, at scaffold level, with 64,769 scaffolds, totalling 176,420,065 bp.",
      distribution: [
        {
          "@type": "DataDownload",
          contentUrl: ASSEMBLY.geneModelUrl,
          encodingFormat: "application/gzip",
        },
      ],
      identifier: "GCA_000002825.3",
      includedInDataCatalog: {
        "@type": "DataCatalog",
        name: APP_TITLE,
        url: BROWSER_URL,
      },
      isAccessibleForFree: true,
      keywords: [
        "Metamonada",
        "Trichomonadidae",
        "Trichomonas",
        "Trichomonas vaginalis",
      ],
      license: "https://creativecommons.org/publicdomain/zero/1.0/",
      name: "Trichomonas vaginalis — G3 (GCA_000002825.3)",
      sameAs: [
        "https://www.ncbi.nlm.nih.gov/datasets/genome/GCA_000002825.3",
        "https://genome.ucsc.edu/h/GCA_000002825.3",
      ],
      url: "https://brc-analytics.org/data/assemblies/GCA_000002825_3",
      variableMeasured: [
        { "@type": "PropertyValue", name: "Scaffolds", value: 64769 },
        {
          "@type": "PropertyValue",
          name: "Scaffold N50",
          unitText: "bp",
          value: 27122,
        },
        { "@type": "PropertyValue", name: "Scaffold L50", value: 1020 },
        { "@type": "PropertyValue", name: "GC%", unitText: "%", value: 33 },
        {
          "@type": "PropertyValue",
          name: "Length",
          unitText: "bp",
          value: 176420065,
        },
        // The catalog writes coverage as text; the record gives it as a number.
        {
          "@type": "PropertyValue",
          name: "Coverage",
          unitText: "x",
          value: 7.2,
        },
      ],
      version: "3",
    });
  });

  it("leaves the strain out of the name when there is none", () => {
    expect(build({ ...ASSEMBLY, strainName: null }).name).toBe(
      "Trichomonas vaginalis (GCA_000002825.3)"
    );
  });

  it("leaves out the fields whose source is missing", () => {
    const jsonLd = build({
      ...ASSEMBLY,
      coverage: null,
      gcPercent: null,
      geneModelUrl: null,
      priorityPathogenName: null,
      scaffoldCount: null,
      scaffoldL50: null,
      scaffoldN50: null,
      ucscBrowserUrl: null,
    });
    expect(jsonLd.distribution).toBeUndefined();
    expect(jsonLd.sameAs).toStrictEqual([
      "https://www.ncbi.nlm.nih.gov/datasets/genome/GCA_000002825.3",
    ]);
    // Length is always set.
    expect(jsonLd.variableMeasured).toStrictEqual([
      {
        "@type": "PropertyValue",
        name: "Length",
        unitText: "bp",
        value: 176420065,
      },
    ]);
  });

  it("lists the priority pathogen name first, without missing levels or repeats", () => {
    const { keywords } = build({
      ...ASSEMBLY,
      priorityPathogenName: "Trichomonas",
      taxonomicGroup: ["Metamonada", "Metamonada"],
    });
    // The genus repeats the pathogen name, and the kingdom is "None".
    expect(keywords).toStrictEqual([
      "Trichomonas",
      "Metamonada",
      "Trichomonadidae",
      "Trichomonas vaginalis",
    ]);
  });
});

describe("buildDescription", () => {
  it("counts chromosomes and scaffolds, singular for one", () => {
    expect(
      buildDescription({
        ...ASSEMBLY,
        chromosomes: 1,
        level: "Complete Genome",
        scaffoldCount: 2,
        strainName: null,
      })
    ).toBe(
      "Genome assembly GCA_000002825.3 of Trichomonas vaginalis, at complete genome level, with 1 chromosome and 2 scaffolds, totalling 176,420,065 bp."
    );
  });

  it("truncates a description over 5000 characters", () => {
    const description = buildDescription({
      ...ASSEMBLY,
      taxonomicLevelSpecies: "x".repeat(6000),
    });
    expect(description).toHaveLength(5000);
    expect(description.endsWith("…")).toBe(true);
  });
});

describe("serializeJsonLd", () => {
  it("escapes characters that could close the script tag", () => {
    const jsonLd = { ...build(ASSEMBLY), name: "</script>&" };
    const serialized = serializeJsonLd(jsonLd);
    expect(serialized).toContain('"name":"\\u003c/script\\u003e\\u0026"');
    expect(JSON.parse(serialized)).toStrictEqual(jsonLd);
  });
});

describe("parseVersion", () => {
  it("returns undefined for an accession with no version", () => {
    expect(parseVersion("GCF_000002765")).toBeUndefined();
  });
});

describe("shouldPublishDatasetRecords", () => {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = environment;
  });

  it.each([
    ["prod", true],
    ["dev", false],
    ["local", false],
  ])("in %s, returns %s", (value, expected) => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = value;
    expect(shouldPublishDatasetRecords()).toBe(expected);
  });
});
