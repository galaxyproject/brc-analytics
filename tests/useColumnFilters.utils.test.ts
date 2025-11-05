import { preSelectColumnFilters } from "../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/hooks/UseColumnFilters/utils";
import { SEQUENCING_DATA_TYPE } from "../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/types";
import { WORKFLOW_PARAMETER_VARIABLE } from "../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import type { Workflow } from "../app/apis/catalog/brc-analytics-catalog/common/entities";

const PARAMETERS: Record<string, Pick<Workflow, "parameters">> = {
  EMPTY: { parameters: [] },
  PAIRED: {
    parameters: [
      {
        key: "paired",
        variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
      },
    ],
  },
  SINGLE: {
    parameters: [
      {
        key: "single",
        variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE,
      },
    ],
  },
};

describe("preSelectColumnFilters", () => {
  test("READ_RUNS_ANY returns empty filters", () => {
    const result = preSelectColumnFilters(
      PARAMETERS.EMPTY,
      SEQUENCING_DATA_TYPE.READ_RUNS_ANY
    );
    expect(result).toEqual([]);
  });

  test("PAIRED with no explicit requirements defaults to layout=PAIRED and strategy=WGS", () => {
    const result = preSelectColumnFilters(
      PARAMETERS.PAIRED,
      SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED
    );

    expect(result).toEqual(
      expect.arrayContaining([
        { id: "library_layout", value: ["PAIRED"] },
        { id: "library_strategy", value: ["WGS"] },
      ])
    );
    expect(result.find((f) => f.id === "description")).toBeUndefined();
    expect(result.find((f) => f.id === "library_source")).toBeUndefined();
  });

  test("PAIRED defaults even when no matching parameter exists", () => {
    const result = preSelectColumnFilters(
      PARAMETERS.EMPTY,
      SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED
    );

    expect(result).toEqual(
      expect.arrayContaining([
        { id: "library_layout", value: ["PAIRED"] },
        { id: "library_strategy", value: ["WGS"] },
      ])
    );
    expect(result.find((f) => f.id === "description")).toBeUndefined();
    expect(result.find((f) => f.id === "library_source")).toBeUndefined();
  });

  test("SINGLE with no explicit requirements defaults to layout=SINGLE and strategy=WGS", () => {
    const result = preSelectColumnFilters(
      PARAMETERS.SINGLE,
      SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE
    );

    expect(result).toEqual(
      expect.arrayContaining([
        { id: "library_layout", value: ["SINGLE"] },
        { id: "library_strategy", value: ["WGS"] },
      ])
    );
    expect(result.find((f) => f.id === "description")).toBeUndefined();
    expect(result.find((f) => f.id === "library_source")).toBeUndefined();
  });

  test("requirements from workflow parameter override defaults (layout/strategy/source/description)", () => {
    const result = preSelectColumnFilters(
      {
        parameters: [
          {
            data_requirements: {
              description: "Prefer high-quality runs",
              library_layout: "SINGLE",
              library_source: ["GENOMIC"],
              library_strategy: ["RNA-Seq", "WGA"],
            },
            key: "paired-reqs",
            variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
          },
        ],
      },
      SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED
    );

    expect(result).toEqual(
      expect.arrayContaining([
        { id: "library_layout", value: ["SINGLE"] },
        { id: "library_strategy", value: ["RNA-Seq", "WGA"] },
        { id: "library_source", value: ["GENOMIC"] },
        { id: "description", value: ["Prefer high-quality runs"] },
      ])
    );
  });

  test("SINGLE defaults even when no matching parameter exists", () => {
    const result = preSelectColumnFilters(
      PARAMETERS.EMPTY,
      SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE
    );

    expect(result).toEqual(
      expect.arrayContaining([
        { id: "library_layout", value: ["SINGLE"] },
        { id: "library_strategy", value: ["WGS"] },
      ])
    );
    expect(result.find((f) => f.id === "description")).toBeUndefined();
    expect(result.find((f) => f.id === "library_source")).toBeUndefined();
  });

  test("empty requirement values do not override defaults and omit optional filters", () => {
    const result = preSelectColumnFilters(
      {
        parameters: [
          {
            data_requirements: {
              description: "",
              library_source: [],
              library_strategy: [],
            },
            key: "paired-empty-reqs",
            variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
          },
        ],
      },
      SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED
    );

    expect(result).toEqual(
      expect.arrayContaining([
        { id: "library_layout", value: ["PAIRED"] },
        { id: "library_strategy", value: ["WGS"] },
      ])
    );
    expect(result.find((f) => f.id === "library_source")).toBeUndefined();
    expect(result.find((f) => f.id === "description")).toBeUndefined();
  });

  test("invalid step key yields empty filters", () => {
    const result = preSelectColumnFilters(PARAMETERS.EMPTY, "geneModelUrl");
    expect(result).toEqual([]);
  });
});
