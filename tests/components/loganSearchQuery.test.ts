import { parseQuery } from "@repo/shared/components/LoganSearch/utils";

describe("parseQuery", () => {
  test("passes FASTA through untouched", () => {
    const text = ">spike desc\nACGTACGTAC\nGTAC\n";

    expect(parseQuery(text)).toEqual({
      bases: 14,
      error: null,
      fasta: text,
      format: "fasta",
      records: 1,
    });
  });

  test("treats bare bases as FASTA", () => {
    expect(parseQuery("ACGT\nACGT")).toMatchObject({
      bases: 8,
      error: null,
      fasta: "ACGT\nACGT",
      format: "fasta",
      records: 0,
    });
  });

  test("turns a single FASTQ record into FASTA", () => {
    expect(parseQuery("@read1 lane=2\nACGTAC\n+\nIIII#I\n")).toEqual({
      bases: 6,
      error: null,
      fasta: ">read1 lane=2\nACGTAC\n",
      format: "fastq",
      records: 1,
    });
  });

  test("reads CRLF, surrounding blank lines and a + line that repeats the header", () => {
    expect(parseQuery("\r\n@r\r\nACGT\r\n+r\r\nIIII\r\n\r\n")).toMatchObject({
      error: null,
      fasta: ">r\nACGT\n",
      format: "fastq",
      records: 1,
    });
  });

  test("keeps a quality line that starts with @ as quality", () => {
    expect(parseQuery("@r\nACGT\n+\n@III")).toMatchObject({
      bases: 4,
      error: null,
      fasta: ">r\nACGT\n",
      records: 1,
    });
  });

  test("counts every record of a multi-record FASTQ", () => {
    const parsed = parseQuery("@a\nACGT\n+\nIIII\n@b\nGG\n+\nII\n");

    expect(parsed.error).toBeNull();
    expect(parsed.records).toBe(2);
    expect(parsed.bases).toBe(6);
  });

  test("says when a record is cut short", () => {
    const parsed = parseQuery("@r\nACGT\n+\n");

    expect(parsed.format).toBe("fastq");
    expect(parsed.error).toBe(
      "Malformed FASTQ: record 1 is incomplete. Each record is four lines: " +
        "@header, sequence, +, quality."
    );
  });

  test("says when the + line is missing", () => {
    expect(parseQuery("@r\nACGT\nIIII\nACGT").error).toMatch(
      /^Malformed FASTQ: record 1 has no \+ line/
    );
  });

  test("says when quality and sequence lengths differ", () => {
    expect(parseQuery("@r\nACGTA\n+\nIIII").error).toBe(
      "Malformed FASTQ: record 1 has 5 bases but 4 quality scores."
    );
  });

  test("names the record that breaks the four-line pattern", () => {
    // Wrapped FASTQ: the second sequence line lands where a header belongs.
    const parsed = parseQuery("@r\nACGT\n+\nIIII\nACGT\n+\nIIII\nIIII");

    expect(parsed.error).toMatch(
      /^Malformed FASTQ: record 2 doesn't start with an @ header/
    );
    expect(parsed.records).toBe(1);
  });
});
