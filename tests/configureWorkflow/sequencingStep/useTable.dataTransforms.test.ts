import {
  mapReadRuns,
  sanitizeReadRuns,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/hooks/UseTable/dataTransforms";
import type {
  BaseReadRun,
  ReadRun,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";

const READ_RUNS: Record<string, BaseReadRun> = {
  EMPTY: {
    fastq_ftp: undefined,
    library_layout: "SINGLE",
  } as unknown as BaseReadRun,
  EMPTY_STRING: {
    fastq_ftp: "",
    library_layout: "SINGLE",
  } as unknown as BaseReadRun,
  PAIRED_INVALID: {
    fastq_ftp: "ftps://only",
    library_layout: "PAIRED",
  } as BaseReadRun,
  PAIRED_VALID: {
    fastq_ftp: "ftps://f1_1;ftps://f1_2",
    library_layout: "PAIRED",
  } as BaseReadRun,
  SINGLE_INVALID: {
    fastq_ftp: "ftps://f1;ftps://f2",
    library_layout: "SINGLE",
  } as BaseReadRun,
  SINGLE_VALID: {
    fastq_ftp: "ftps://f1",
    library_layout: "SINGLE",
  } as BaseReadRun,
};

describe("mapReadRuns", () => {
  test("returns empty array for undefined input", () => {
    expect(mapReadRuns(undefined)).toEqual([]);
  });

  test("SINGLE with exactly 1 FASTQ is valid", () => {
    const runs = mapReadRuns([READ_RUNS.SINGLE_VALID]);
    expect(runs[0].validation.isValid).toBe(true);
    expect(runs[0].validation.error).toBeUndefined();
  });

  test("SINGLE with 2 FASTQs is invalid with correct message", () => {
    const runs = mapReadRuns([READ_RUNS.SINGLE_INVALID]);
    expect(runs[0].validation.isValid).toBe(false);
    expect(runs[0].validation.error).toBe(
      '"SINGLE" run must have exactly 1 FASTQ file, found 2.'
    );
  });

  test("PAIRED with 2 FASTQs is valid", () => {
    const runs = mapReadRuns([READ_RUNS.PAIRED_VALID]);
    expect(runs[0].validation.isValid).toBe(true);
    expect(runs[0].validation.error).toBeUndefined();
  });

  test("PAIRED with 1 FASTQ is invalid with correct message", () => {
    const runs = mapReadRuns([READ_RUNS.PAIRED_INVALID]);
    expect(runs[0].validation.isValid).toBe(false);
    expect(runs[0].validation.error).toBe(
      '"PAIRED" run must have exactly 2 FASTQ files, found 1.'
    );
  });

  test("missing or empty fastq_ftp is invalid", () => {
    [READ_RUNS.EMPTY, READ_RUNS.EMPTY_STRING].forEach((run) => {
      const runs = mapReadRuns([run]);
      expect(runs[0].validation.isValid).toBe(false);
      expect(runs[0].validation.error).toBe(
        "FASTQ data is missing or invalid."
      );
    });
  });

  test("invalid library_layout yields invalid with message", () => {
    const runs = mapReadRuns([
      {
        fastq_ftp: "ftps://ok",
        library_layout: "UNKNOWN",
      } as unknown as BaseReadRun,
    ]);
    expect(runs[0].validation.isValid).toBe(false);
    expect(runs[0].validation.error).toBe('Invalid library layout: "UNKNOWN".');
  });
});

describe("sanitizeReadRuns", () => {
  test("coerces non-string fastq_ftp to empty string, leaves string intact", () => {
    const runs = sanitizeReadRuns([
      {
        fastq_ftp: "ftps://ok",
        validation: { error: undefined, isValid: true },
      },
      {
        fastq_ftp: ["ftps://a", "ftps://b"],
        validation: { error: undefined, isValid: true },
      },
      {
        fastq_ftp: { url: "ftps://a" },
        validation: { error: undefined, isValid: true },
      },
    ] as ReadRun[]);

    expect(runs[0].fastq_ftp).toBe("ftps://ok");
    expect(runs[1].fastq_ftp).toBe("");
    expect(runs[2].fastq_ftp).toBe("");
  });
});
