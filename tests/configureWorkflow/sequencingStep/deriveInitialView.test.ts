import { VIEW } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ToggleButtonGroup/types";
import { getInitialView } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/utils";

describe("getInitialView", () => {
  test("empty configuredInput returns ENA (default)", () => {
    expect(getInitialView({})).toBe(VIEW.ENA);
  });

  test("readRunsPaired === [] returns UPLOAD_MY_DATA", () => {
    expect(getInitialView({ readRunsPaired: [] })).toBe(VIEW.UPLOAD_MY_DATA);
  });

  test("readRunsSingle === [] returns UPLOAD_MY_DATA", () => {
    expect(getInitialView({ readRunsSingle: [] })).toBe(VIEW.UPLOAD_MY_DATA);
  });

  test("both empty arrays return UPLOAD_MY_DATA (assistant upload handoff shape)", () => {
    expect(
      getInitialView({
        readRunPairedFile: null,
        readRunSingleFile: null,
        readRunsPaired: [],
        readRunsSingle: [],
      })
    ).toBe(VIEW.UPLOAD_MY_DATA);
  });

  test("readRunsPaired === null returns ENA", () => {
    expect(getInitialView({ readRunsPaired: null })).toBe(VIEW.ENA);
  });

  test("non-empty readRunsPaired returns ENA (user has ENA selections)", () => {
    expect(
      getInitialView({
        readRunsPaired: [
          { md5Hashes: "m", runAccession: "ERR1", urls: "ftp://e" },
        ],
      })
    ).toBe(VIEW.ENA);
  });

  test("scalar file fields alone do not signal upload (file mode is array=[] driven)", () => {
    expect(
      getInitialView({
        readRunPairedFile: null,
        readRunSingleFile: null,
      })
    ).toBe(VIEW.ENA);
  });
});
