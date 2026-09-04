import { SEQUENCING_SOURCE } from "@repo/shared/providers/workflowHandoff/constants";
import {
  extractAccessions,
  parseDataSourceDetail,
  resolveSequencingSource,
} from "@repo/shared/providers/workflowHandoff/dataSource";
import type { SchemaFieldState } from "@repo/shared/services/api-client/types";

function field(
  value: string | null,
  detail: string | null = null
): SchemaFieldState {
  return { detail, status: "filled", value };
}

describe("parseDataSourceDetail", () => {
  test("parses a structured detail", () => {
    expect(
      parseDataSourceDetail('{"source":"logan","accessions":["ERR662077"]}')
    ).toEqual({ accessions: ["ERR662077"], source: "logan" });
  });

  test("null detail returns null", () => {
    expect(parseDataSourceDetail(null)).toBeNull();
  });

  test("a bare taxid (a pre-#1296 detail) returns null", () => {
    expect(parseDataSourceDetail("5833")).toBeNull();
  });

  test("unparseable JSON returns null", () => {
    expect(parseDataSourceDetail("{not json")).toBeNull();
  });

  test("a JSON array is not a detail object", () => {
    expect(parseDataSourceDetail('["ERR662077"]')).toBeNull();
  });
});

describe("extractAccessions", () => {
  test("prefers the structured detail over the value", () => {
    const f = field(
      "Top 2 runs from Logan",
      '{"source":"logan","accessions":["ERR662077","SRR7590703"]}'
    );
    expect(extractAccessions(f)).toEqual(["ERR662077", "SRR7590703"]);
  });

  test("an empty accessions list falls back to the value", () => {
    expect(
      extractAccessions(
        field("ERR16655350", '{"source":"ena","accessions":[]}')
      )
    ).toEqual(["ERR16655350"]);
  });

  test("dedupes structured accessions", () => {
    expect(
      extractAccessions(
        field(null, '{"accessions":["SRR7590703","SRR7590703"]}')
      )
    ).toEqual(["SRR7590703"]);
  });

  // The cast in parseDataSourceDetail is a promise TypeScript cannot keep:
  // it proves the payload is a JSON object and nothing about the fields
  // inside it. Every shape below reached the stepper as "accessions" before
  // the guard, and none of them errored on the way.
  describe("a detail whose accessions are the wrong shape", () => {
    test("a bare string is not spread into single characters", () => {
      // The one that would have shipped: "ERR662077" passed both the
      // truthiness and the .length > 0 check, and spreading a string into a
      // Set produced ["E","R","6","2","0","7"].
      expect(
        extractAccessions(
          field(
            "Top run ERR662077 from Logan",
            '{"source":"logan","accessions":"ERR662077"}'
          )
        )
      ).toEqual(["ERR662077"]);
    });

    test("a string with no accession in the value yields nothing", () => {
      expect(
        extractAccessions(field("User upload", '{"accessions":"ERR662077"}'))
      ).toEqual([]);
    });

    test("an array of numbers does not pass them off as accessions", () => {
      expect(
        extractAccessions(field("ERR16655350", '{"accessions":[123,456]}'))
      ).toEqual(["ERR16655350"]);
    });

    test("one bad member discards the whole list", () => {
      // All-or-nothing: a partly-broken list means the producer is broken,
      // and half of it is a worse fetch input than the model's own text.
      expect(
        extractAccessions(
          field("ERR16655350", '{"accessions":["ERR662077",null]}')
        )
      ).toEqual(["ERR16655350"]);
    });

    test("a nested object falls through to the value", () => {
      expect(
        extractAccessions(
          field("ERR16655350", '{"accessions":{"0":"ERR662077"}}')
        )
      ).toEqual(["ERR16655350"]);
    });

    test("a null accessions field falls through to the value", () => {
      expect(
        extractAccessions(field("ERR16655350", '{"accessions":null}'))
      ).toEqual(["ERR16655350"]);
    });
  });

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

  test("too-short ids are not accessions", () => {
    expect(extractAccessions(field("ENA (ERR16655350) and ERR12"))).toEqual([
      "ERR16655350",
    ]);
  });

  test("dedupes value matches", () => {
    expect(extractAccessions(field("SRR7590703 SRR7590703"))).toEqual([
      "SRR7590703",
    ]);
  });

  test("lowercase accessions are NOT matched (real accessions are uppercase)", () => {
    expect(extractAccessions(field("err16655350"))).toEqual([]);
  });
});

describe("resolveSequencingSource", () => {
  test("detail.source upload wins over the value", () => {
    expect(
      resolveSequencingSource(field("anything", '{"source":"upload"}'))
    ).toBe(SEQUENCING_SOURCE.UPLOAD);
  });

  test("detail.source logan wins over upload-looking value text", () => {
    expect(
      resolveSequencingSource(
        field("my own data", '{"source":"logan","accessions":["ERR662077"]}')
      )
    ).toBe(SEQUENCING_SOURCE.ENA);
  });

  test("detail.source ena resolves to ENA", () => {
    expect(resolveSequencingSource(field(null, '{"source":"ena"}'))).toBe(
      SEQUENCING_SOURCE.ENA
    );
  });

  test("null value returns ENA (default fall-through)", () => {
    expect(resolveSequencingSource(field(null))).toBe(SEQUENCING_SOURCE.ENA);
  });

  test("empty string returns ENA", () => {
    expect(resolveSequencingSource(field(""))).toBe(SEQUENCING_SOURCE.ENA);
  });

  test("'User upload' returns UPLOAD", () => {
    expect(resolveSequencingSource(field("User upload"))).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("'upload my own data' returns UPLOAD", () => {
    expect(resolveSequencingSource(field("upload my own data"))).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("'use local files' returns UPLOAD", () => {
    expect(resolveSequencingSource(field("use local files"))).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("uppercase 'UPLOAD' returns UPLOAD (case insensitive)", () => {
    expect(resolveSequencingSource(field("UPLOAD"))).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("'ENA/SRA — SRR12345678' returns ENA", () => {
    expect(resolveSequencingSource(field("ENA/SRA — SRR12345678"))).toBe(
      SEQUENCING_SOURCE.ENA
    );
  });

  test("'ENA' returns ENA", () => {
    expect(resolveSequencingSource(field("ENA"))).toBe(SEQUENCING_SOURCE.ENA);
  });

  test("'unknown source' returns ENA (word-bound — 'own' substring doesn't match)", () => {
    expect(resolveSequencingSource(field("unknown source"))).toBe(
      SEQUENCING_SOURCE.ENA
    );
  });

  test("'user upload' returns UPLOAD", () => {
    expect(resolveSequencingSource(field("user upload"))).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });

  test("'user-provided FASTQs' returns UPLOAD (user keyword)", () => {
    expect(resolveSequencingSource(field("user-provided FASTQs"))).toBe(
      SEQUENCING_SOURCE.UPLOAD
    );
  });
});
