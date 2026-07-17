import { getInitialToggleValue } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/utils";
import { VIEW } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ToggleButtonGroup/types";

describe("getInitialToggleValue", () => {
  test("empty configuredInput returns ENA (default)", () => {
    expect(getInitialToggleValue({})).toBe(VIEW.ENA);
  });

  test("readRunsPaired === [] returns UPLOAD_MY_DATA", () => {
    expect(getInitialToggleValue({ readRunsPaired: [] })).toBe(
      VIEW.UPLOAD_MY_DATA
    );
  });

  test("readRunsSingle === [] returns UPLOAD_MY_DATA", () => {
    expect(getInitialToggleValue({ readRunsSingle: [] })).toBe(
      VIEW.UPLOAD_MY_DATA
    );
  });

  test("both empty arrays return UPLOAD_MY_DATA (assistant upload handoff shape)", () => {
    expect(
      getInitialToggleValue({
        readRunPairedFile: null,
        readRunSingleFile: null,
        readRunsPaired: [],
        readRunsSingle: [],
      })
    ).toBe(VIEW.UPLOAD_MY_DATA);
  });

  test("readRunsPaired === null returns ENA", () => {
    expect(getInitialToggleValue({ readRunsPaired: null })).toBe(VIEW.ENA);
  });

  test("non-empty readRunsPaired returns ENA (user has ENA selections)", () => {
    expect(
      getInitialToggleValue({
        readRunsPaired: [
          { md5Hashes: "m", runAccession: "ERR1", urls: "ftp://e" },
        ],
      })
    ).toBe(VIEW.ENA);
  });

  test("scalar file fields alone do not signal upload (file mode is array=[] driven)", () => {
    expect(
      getInitialToggleValue({
        readRunPairedFile: null,
        readRunSingleFile: null,
      })
    ).toBe(VIEW.ENA);
  });
});
