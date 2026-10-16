import type {
  AnalysisSchema,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import { getClearFieldMessage } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/FilledValue/hooks/UseClearField/utils";
import { getFieldLabel } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/FilledValue/utils";
import { getProgressValue } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Progress/utils";
import { PLACEHOLDER_FIELD } from "@repo/shared/views/AssistantView/components/AnalysisSetup/constants";
import {
  countSetFields,
  countTotalFields,
  getField,
  isOptionalField,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/utils";

const EMPTY: SchemaFieldState = { detail: null, status: "empty", value: null };

function filled(value: string, detail: string | null = null): SchemaFieldState {
  return { detail, status: "filled", value };
}

function schema(overrides: Partial<AnalysisSchema> = {}): AnalysisSchema {
  return {
    analysis_type: EMPTY,
    assembly: EMPTY,
    data_characteristics: EMPTY,
    data_source: EMPTY,
    gene_annotation: EMPTY,
    organism: EMPTY,
    workflow: EMPTY,
    ...overrides,
  };
}

describe("countSetFields", () => {
  test("counts nothing before the assistant has returned a schema", () => {
    expect(countSetFields(null)).toBe(0);
  });

  test("counts only filled fields, not empty or flagged ones", () => {
    expect(
      countSetFields(
        schema({
          assembly: filled("S288C (GCF_000146045.2)"),
          gene_annotation: {
            detail: "No gene model for the selected assembly",
            status: "needs_attention",
            value: "Reference GTF",
          },
          organism: filled("Saccharomyces cerevisiae"),
        })
      )
    ).toBe(2);
  });

  test("counts every field once all are filled", () => {
    const all = filled("x");
    expect(
      countSetFields(
        schema({
          analysis_type: all,
          assembly: all,
          data_characteristics: all,
          data_source: all,
          gene_annotation: all,
          organism: all,
          workflow: all,
        })
      )
    ).toBe(7);
  });
});

// Every field set except gene annotation, which the assistant leaves empty when
// the chosen workflow doesn't need a GTF.
const WITHOUT_GENE_ANNOTATION: Partial<AnalysisSchema> = {
  analysis_type: filled("Variant calling"),
  assembly: filled("GCF_000002765.6"),
  data_characteristics: filled("Paired-end Illumina"),
  data_source: filled("User upload"),
  organism: filled("Plasmodium falciparum"),
  workflow: filled("Haploid variant calling"),
};

const NEEDS_ATTENTION: SchemaFieldState = {
  detail: "No gene model for the selected assembly",
  status: "needs_attention",
  value: "Reference GTF",
};

describe("countTotalFields", () => {
  test("counts every field before the assistant has returned a schema", () => {
    expect(countTotalFields(null)).toBe(7);
  });

  test("counts every field before a workflow is chosen", () => {
    expect(countTotalFields(schema())).toBe(7);
  });

  test("leaves out gene annotation when the chosen workflow doesn't need it", () => {
    expect(countTotalFields(schema(WITHOUT_GENE_ANNOTATION))).toBe(6);
  });

  test("counts gene annotation once the assistant has filled it", () => {
    expect(
      countTotalFields(
        schema({
          ...WITHOUT_GENE_ANNOTATION,
          gene_annotation: filled("Reference GTF"),
        })
      )
    ).toBe(7);
  });

  test("counts gene annotation when it needs attention", () => {
    expect(
      countTotalFields(
        schema({ ...WITHOUT_GENE_ANNOTATION, gene_annotation: NEEDS_ATTENTION })
      )
    ).toBe(7);
  });
});

describe("getProgressValue", () => {
  test("is empty before the assistant has returned a schema", () => {
    expect(getProgressValue(null)).toBe(0);
  });

  test("is full once every counted field is set", () => {
    expect(getProgressValue(schema(WITHOUT_GENE_ANNOTATION))).toBe(100);
  });

  test("is partial while a needed gene annotation is missing", () => {
    expect(
      getProgressValue(
        schema({ ...WITHOUT_GENE_ANNOTATION, gene_annotation: NEEDS_ATTENTION })
      )
    ).toBeCloseTo((6 / 7) * 100);
  });
});

describe("isOptionalField", () => {
  test("is optional once a workflow and an assembly are chosen and it is empty", () => {
    expect(
      isOptionalField(schema(WITHOUT_GENE_ANNOTATION), "gene_annotation")
    ).toBe(true);
  });

  test("is not optional before the assistant has returned a schema", () => {
    expect(isOptionalField(null, "gene_annotation")).toBe(false);
  });

  test("is never optional for a field a workflow always needs", () => {
    expect(
      isOptionalField(
        schema({ ...WITHOUT_GENE_ANNOTATION, data_source: EMPTY }),
        "data_source"
      )
    ).toBe(false);
  });

  test("is not optional before a workflow is chosen", () => {
    expect(
      isOptionalField(
        schema({ ...WITHOUT_GENE_ANNOTATION, workflow: EMPTY }),
        "gene_annotation"
      )
    ).toBe(false);
  });

  // The assistant also leaves gene annotation empty when the workflow needs a
  // GTF but no assembly is chosen to say whether one exists.
  test("is not optional before an assembly is chosen", () => {
    expect(
      isOptionalField(
        schema({ ...WITHOUT_GENE_ANNOTATION, assembly: EMPTY }),
        "gene_annotation"
      )
    ).toBe(false);
  });

  test("is not optional once the assistant has filled it", () => {
    expect(
      isOptionalField(
        schema({
          ...WITHOUT_GENE_ANNOTATION,
          gene_annotation: filled("Reference GTF"),
        }),
        "gene_annotation"
      )
    ).toBe(false);
  });

  test("is not optional when it needs attention", () => {
    expect(
      isOptionalField(
        schema({
          ...WITHOUT_GENE_ANNOTATION,
          gene_annotation: NEEDS_ATTENTION,
        }),
        "gene_annotation"
      )
    ).toBe(false);
  });
});

describe("getField", () => {
  test("falls back to the placeholder before a schema exists", () => {
    expect(getField(null, "organism")).toBe(PLACEHOLDER_FIELD);
  });

  test("returns the schema's own field", () => {
    const organism = filled("Plasmodium falciparum");
    expect(getField(schema({ organism }), "organism")).toBe(organism);
  });
});

describe("getFieldLabel", () => {
  test("shows an assembly's accession from its detail", () => {
    expect(
      getFieldLabel(
        "assembly",
        filled("3D7 (GCF_000002765.6)", "GCF_000002765.6")
      )
    ).toBe("GCF_000002765.6");
  });

  test("falls back to an assembly's value without a detail", () => {
    expect(getFieldLabel("assembly", filled("GCF_000002765.6"))).toBe(
      "GCF_000002765.6"
    );
  });

  test("ignores detail for other fields", () => {
    expect(
      getFieldLabel(
        "workflow",
        filled(
          "Haploid variant calling (haploid-variant-calling-wgs-pe-main)",
          "#workflow/github.com/iwc-workflows/haploid-variant-calling-wgs-pe/main"
        )
      )
    ).toBe("Haploid variant calling (haploid-variant-calling-wgs-pe-main)");
  });

  test("returns an empty label for a missing value", () => {
    expect(getFieldLabel("organism", EMPTY)).toBe("");
  });
});

describe("getClearFieldMessage", () => {
  // The wording is load-bearing: the assistant declines a bare "Clear the X."
  // (it treats the analysis state as system-managed), leaving the field set.
  test("words the clear as the user changing their mind", () => {
    expect(getClearFieldMessage("Data source")).toBe(
      "Let's not use that data source; I'll choose a different one."
    );
  });
});
