import type {
  AnalysisSchema,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import { getFieldLabel } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/FilledValue/utils";
import { PLACEHOLDER_FIELD } from "@repo/shared/views/AssistantView/components/AnalysisSetup/constants";
import {
  countSetFields,
  getField,
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
