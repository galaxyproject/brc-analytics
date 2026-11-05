import type { AssemblySummary } from "@repo/shared/meta/assembly/types";
import {
  buildAssemblyDescription,
  buildAssemblyName,
  buildAssemblyPageMeta,
} from "@repo/shared/meta/assembly/utils";

// Plasmodium falciparum 3D7, the fields both sites' assembly records share.
const ASSEMBLY: AssemblySummary = {
  accession: "GCF_000002765.6",
  chromosomes: 14,
  length: 23292622,
  level: "Complete Genome",
  scaffoldCount: 14,
  strainName: null,
  taxonomicLevelSpecies: "Plasmodium falciparum",
};

describe("buildAssemblyName", () => {
  test("names the species and accession", () => {
    expect(buildAssemblyName(ASSEMBLY)).toBe(
      "Plasmodium falciparum (GCF_000002765.6)"
    );
  });

  test("adds the strain when the assembly has one", () => {
    expect(buildAssemblyName({ ...ASSEMBLY, strainName: "3D7" })).toBe(
      "Plasmodium falciparum — 3D7 (GCF_000002765.6)"
    );
  });
});

describe("buildAssemblyDescription", () => {
  test("describes the organism, level, counts and length", () => {
    expect(buildAssemblyDescription(ASSEMBLY)).toBe(
      "Genome assembly GCF_000002765.6 of Plasmodium falciparum, at complete genome level, with 14 chromosomes and 14 scaffolds, totaling 23,292,622 bp."
    );
  });

  test("uses the singular for a count of one", () => {
    expect(
      buildAssemblyDescription({
        ...ASSEMBLY,
        chromosomes: 1,
        scaffoldCount: 2,
      })
    ).toBe(
      "Genome assembly GCF_000002765.6 of Plasmodium falciparum, at complete genome level, with 1 chromosome and 2 scaffolds, totaling 23,292,622 bp."
    );
  });

  test("leaves out counts the catalog doesn't have", () => {
    expect(
      buildAssemblyDescription({
        ...ASSEMBLY,
        chromosomes: null,
        scaffoldCount: null,
      })
    ).toBe(
      "Genome assembly GCF_000002765.6 of Plasmodium falciparum, at complete genome level, totaling 23,292,622 bp."
    );
  });
});

describe("buildAssemblyPageMeta", () => {
  test("titles the page with the name and describes it with the sentence", () => {
    expect(buildAssemblyPageMeta({ ...ASSEMBLY, strainName: "3D7" })).toEqual({
      pageDescription:
        "Genome assembly GCF_000002765.6 of Plasmodium falciparum 3D7, at complete genome level, with 14 chromosomes and 14 scaffolds, totaling 23,292,622 bp.",
      pageTitle: "Plasmodium falciparum — 3D7 (GCF_000002765.6)",
    });
  });
});
