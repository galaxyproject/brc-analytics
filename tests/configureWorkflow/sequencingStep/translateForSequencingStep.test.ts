import { translateForSequencingStep } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/utils";
import type { EnaSequencingReads } from "@/utils/galaxy-api/types";

const RUN_A: EnaSequencingReads = {
  md5Hashes: "md5-a",
  runAccession: "ERR1",
  urls: "ftp://run-a",
};
const RUN_B: EnaSequencingReads = {
  md5Hashes: "md5-b",
  runAccession: "ERR2",
  urls: "ftp://run-b",
};

describe("translateForSequencingStep", () => {
  describe("array-based step (or undefined stepKey) — pass-through", () => {
    test("undefined stepKey returns partial unchanged", () => {
      const partial = { readRunsPaired: [RUN_A] };
      expect(translateForSequencingStep(partial, undefined)).toEqual(partial);
    });

    test("readRunsPaired stepKey returns partial unchanged", () => {
      const partial = { readRunsPaired: [RUN_A, RUN_B] };
      expect(translateForSequencingStep(partial, "readRunsPaired")).toEqual(
        partial
      );
    });

    test("readRunsAny stepKey returns partial unchanged", () => {
      const partial = { readRunsPaired: [RUN_A], readRunsSingle: [RUN_B] };
      expect(translateForSequencingStep(partial, "readRunsAny")).toEqual(
        partial
      );
    });
  });

  describe("readRunSingleFile (single-file scalar step)", () => {
    test("collapses readRunsSingle: [run] → readRunSingleFile: run + readRunsSingle: null", () => {
      const result = translateForSequencingStep(
        { readRunsSingle: [RUN_A] },
        "readRunSingleFile"
      );
      expect(result).toEqual({
        readRunSingleFile: RUN_A,
        readRunsSingle: null,
      });
    });

    test("truncates to runs[0] when multiple runs provided", () => {
      const result = translateForSequencingStep(
        { readRunsSingle: [RUN_A, RUN_B] },
        "readRunSingleFile"
      );
      expect(result).toEqual({
        readRunSingleFile: RUN_A,
        readRunsSingle: null,
      });
    });

    test("readRunsSingle: [] → readRunSingleFile: null (upload-mode signal)", () => {
      const result = translateForSequencingStep(
        { readRunsSingle: [] },
        "readRunSingleFile"
      );
      expect(result).toEqual({
        readRunSingleFile: null,
        readRunsSingle: null,
      });
    });

    test("readRunsSingle: null → readRunSingleFile: null", () => {
      const result = translateForSequencingStep(
        { readRunsSingle: null },
        "readRunSingleFile"
      );
      expect(result).toEqual({
        readRunSingleFile: null,
        readRunsSingle: null,
      });
    });

    test("when partial lacks readRunsSingle, passes through unchanged", () => {
      const partial = { readRunsPaired: [RUN_A] };
      expect(translateForSequencingStep(partial, "readRunSingleFile")).toBe(
        partial
      );
    });
  });

  describe("readRunPairedFile (paired-file scalar step)", () => {
    test("collapses readRunsPaired: [run] → readRunPairedFile: run + readRunsPaired: null", () => {
      const result = translateForSequencingStep(
        { readRunsPaired: [RUN_A] },
        "readRunPairedFile"
      );
      expect(result).toEqual({
        readRunPairedFile: RUN_A,
        readRunsPaired: null,
      });
    });

    test("truncates to runs[0] when multiple runs provided", () => {
      const result = translateForSequencingStep(
        { readRunsPaired: [RUN_A, RUN_B] },
        "readRunPairedFile"
      );
      expect(result).toEqual({
        readRunPairedFile: RUN_A,
        readRunsPaired: null,
      });
    });

    test("readRunsPaired: [] → readRunPairedFile: null (upload-mode signal)", () => {
      const result = translateForSequencingStep(
        { readRunsPaired: [] },
        "readRunPairedFile"
      );
      expect(result).toEqual({
        readRunPairedFile: null,
        readRunsPaired: null,
      });
    });

    test("when partial lacks readRunsPaired, passes through unchanged", () => {
      const partial = { readRunsSingle: [RUN_A] };
      expect(translateForSequencingStep(partial, "readRunPairedFile")).toBe(
        partial
      );
    });
  });
});
