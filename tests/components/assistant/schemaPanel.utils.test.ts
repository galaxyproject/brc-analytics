import {
  buildHandoffUrl,
  extractAccessions,
  resolveDataSource,
} from "../../../app/components/Assistant/SchemaPanel/utils";
import type { AnalysisSchema, SchemaFieldState } from "../../../app/types/api";

const ORIGIN = "http://localhost:3000";
const HANDOFF_URL =
  "/data/assemblies/GCF_000002765_6/analyze/workflows/workflow-foo-versions-v0-1";

function field(value: string | null): SchemaFieldState {
  return { detail: null, status: "filled", value };
}

function schemaWith(dataSourceValue: string | null): AnalysisSchema {
  const empty = field(null);
  return {
    analysis_type: empty,
    assembly: empty,
    data_characteristics: empty,
    data_source: field(dataSourceValue),
    gene_annotation: empty,
    organism: empty,
    workflow: empty,
  };
}

describe("buildHandoffUrl", () => {
  test("upload mode: dataSource=upload, no accessions param", () => {
    const url = buildHandoffUrl(HANDOFF_URL, schemaWith("User upload"), ORIGIN);
    expect(url).toBe(`${HANDOFF_URL}?dataSource=upload`);
  });

  test("ENA mode with one accession: dataSource + accessions in URL", () => {
    const url = buildHandoffUrl(
      HANDOFF_URL,
      schemaWith("ENA (ERR16655350)"),
      ORIGIN
    );
    expect(url).toBe(`${HANDOFF_URL}?dataSource=ena&accessions=ERR16655350`);
  });

  test("ENA mode without accession: dataSource=ena, no accessions param", () => {
    const url = buildHandoffUrl(HANDOFF_URL, schemaWith("ENA/SRA"), ORIGIN);
    expect(url).toBe(`${HANDOFF_URL}?dataSource=ena`);
  });

  test("multiple accessions: comma-separated in URL", () => {
    const url = buildHandoffUrl(
      HANDOFF_URL,
      schemaWith("ENA (ERR1234567, ERR7654321)"),
      ORIGIN
    );
    expect(url).toBe(
      `${HANDOFF_URL}?dataSource=ena&accessions=ERR1234567%2CERR7654321`
    );
  });

  test("returns pathname + search, not the full origin-qualified URL", () => {
    const url = buildHandoffUrl(HANDOFF_URL, schemaWith("User upload"), ORIGIN);
    expect(url.startsWith("/")).toBe(true);
    expect(url).not.toContain(ORIGIN);
  });
});

describe("extractAccessions", () => {
  test("null value returns empty array", () => {
    expect(extractAccessions(field(null))).toEqual([]);
  });

  test("empty string returns empty array", () => {
    expect(extractAccessions(field(""))).toEqual([]);
  });

  test("no accession in value returns empty array", () => {
    expect(extractAccessions(field("User upload"))).toEqual([]);
  });

  test("observed format: 'ENA (ERR16655350)'", () => {
    expect(extractAccessions(field("ENA (ERR16655350)"))).toEqual([
      "ERR16655350",
    ]);
  });

  test("observed format: 'ENA/SRA — SRR12345678'", () => {
    expect(extractAccessions(field("ENA/SRA — SRR12345678"))).toEqual([
      "SRR12345678",
    ]);
  });

  test("DDBJ format DRR accessions", () => {
    expect(extractAccessions(field("DRR123456"))).toEqual(["DRR123456"]);
  });

  test("multiple accessions in one string", () => {
    expect(
      extractAccessions(field("Use ERR1234567 and ERR7654321 for paired-end"))
    ).toEqual(["ERR1234567", "ERR7654321"]);
  });

  test("lowercase accessions are NOT matched (real accessions are uppercase)", () => {
    expect(extractAccessions(field("err16655350"))).toEqual([]);
  });
});

describe("resolveDataSource", () => {
  test("null returns 'ena' (default fall-through)", () => {
    expect(resolveDataSource(null)).toBe("ena");
  });

  test("undefined returns 'ena'", () => {
    expect(resolveDataSource(undefined)).toBe("ena");
  });

  test("empty string returns 'ena'", () => {
    expect(resolveDataSource("")).toBe("ena");
  });

  test("'User upload' returns 'upload'", () => {
    expect(resolveDataSource("User upload")).toBe("upload");
  });

  test("'upload my own data' returns 'upload'", () => {
    expect(resolveDataSource("upload my own data")).toBe("upload");
  });

  test("'use local files' returns 'upload'", () => {
    expect(resolveDataSource("use local files")).toBe("upload");
  });

  test("uppercase 'UPLOAD' returns 'upload' (case insensitive)", () => {
    expect(resolveDataSource("UPLOAD")).toBe("upload");
  });

  test("'ENA/SRA — SRR12345678' returns 'ena'", () => {
    expect(resolveDataSource("ENA/SRA — SRR12345678")).toBe("ena");
  });

  test("'ENA' returns 'ena'", () => {
    expect(resolveDataSource("ENA")).toBe("ena");
  });
});
