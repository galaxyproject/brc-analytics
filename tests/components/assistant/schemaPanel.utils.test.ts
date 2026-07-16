import {
  extractAccessions,
  resolveSequencingSource,
} from "@/components/Assistant/SchemaPanel/utils";
import { SEQUENCING_SOURCE } from "@/providers/workflowHandoff/constants";
import type { SchemaFieldState } from "@brc-analytics/core/types/api";

function field(value: string | null): SchemaFieldState {
  return { detail: null, status: "filled", value };
}

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

describe("resolveSequencingSource", () => {
  test("null returns ENA (default fall-through)", () => {
    expect(resolveSequencingSource(null)).toBe(SEQUENCING_SOURCE.ENA);
  });

  test("undefined returns ENA", () => {
    expect(resolveSequencingSource(undefined)).toBe(SEQUENCING_SOURCE.ENA);
  });

  test("empty string returns ENA", () => {
    expect(resolveSequencingSource("")).toBe(SEQUENCING_SOURCE.ENA);
  });

  test("'User upload' returns UPLOAD", () => {
    expect(resolveSequencingSource("User upload")).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("'upload my own data' returns UPLOAD", () => {
    expect(resolveSequencingSource("upload my own data")).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("'use local files' returns UPLOAD", () => {
    expect(resolveSequencingSource("use local files")).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("uppercase 'UPLOAD' returns UPLOAD (case insensitive)", () => {
    expect(resolveSequencingSource("UPLOAD")).toBe(SEQUENCING_SOURCE.UPLOAD);
  });

  test("'ENA/SRA — SRR12345678' returns ENA", () => {
    expect(resolveSequencingSource("ENA/SRA — SRR12345678")).toBe(
      SEQUENCING_SOURCE.ENA
    );
  });

  test("'ENA' returns ENA", () => {
    expect(resolveSequencingSource("ENA")).toBe(SEQUENCING_SOURCE.ENA);
  });

  test("'unknown source' returns ENA (word-bound — 'own' substring doesn't match)", () => {
    expect(resolveSequencingSource("unknown source")).toBe(
      SEQUENCING_SOURCE.ENA
    );
  });

  test("'user upload' returns UPLOAD", () => {
    expect(resolveSequencingSource("user upload")).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("'user-provided FASTQs' returns UPLOAD (user keyword)", () => {
    expect(resolveSequencingSource("user-provided FASTQs")).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });
});
