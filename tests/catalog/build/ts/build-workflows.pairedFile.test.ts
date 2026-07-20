import { WORKFLOW_PARAMETER_VARIABLE } from "@brc-analytics/core/apis/schema-types";
import { buildWorkflows } from "../../../../catalog/build/ts/build-workflows";

// Mock YAML file reading so we can inject source workflows.
jest.mock("../../../../catalog/build/ts/utils", () => ({
  readYamlFile: jest.fn(),
  saveJson: jest.fn(),
}));

import { readYamlFile } from "../../../../catalog/build/ts/utils";

const mockReadYamlFile = readYamlFile as jest.MockedFunction<
  typeof readYamlFile
>;

const BASE_SOURCE_WORKFLOW = {
  active: true,
  assembly_count_max: 0,
  assembly_count_min: 0,
  categories: ["ASSEMBLY"],
  iwc_id: "test-iwc",
  parameters: [],
  ploidy: "ANY",
  scope: "ORGANISM",
  trs_id: "#test/trs",
  workflow_description: "test workflow",
  workflow_name: "Test Workflow",
};

describe("buildWorkflows - paired-file variable validation", () => {
  beforeEach(() => {
    mockReadYamlFile.mockReset();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("includes workflow with both forward and reverse file variables", async () => {
    mockReadYamlFile.mockImplementation(async (path: string) => {
      if (path.includes("workflow_categories")) {
        return {
          workflow_categories: [
            {
              category: "ASSEMBLY",
              description: "d",
              name: "n",
              show_coming_soon: false,
            },
          ],
        };
      }
      return {
        workflows: [
          {
            ...BASE_SOURCE_WORKFLOW,
            parameters: [
              {
                key: "forward",
                variable:
                  WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_FORWARD_FILE,
              },
              {
                key: "reverse",
                variable:
                  WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_REVERSE_FILE,
              },
            ],
          },
        ],
      };
    });

    const result = await buildWorkflows();
    expect(result[0].workflows).toHaveLength(1);
    expect(result[0].workflows[0].parameters).toHaveLength(2);
  });

  test("skips workflow with only forward file variable", async () => {
    mockReadYamlFile.mockImplementation(async (path: string) => {
      if (path.includes("workflow_categories")) {
        return {
          workflow_categories: [
            {
              category: "ASSEMBLY",
              description: "d",
              name: "n",
              show_coming_soon: false,
            },
          ],
        };
      }
      return {
        workflows: [
          {
            ...BASE_SOURCE_WORKFLOW,
            parameters: [
              {
                key: "forward",
                variable:
                  WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_FORWARD_FILE,
              },
            ],
          },
        ],
      };
    });

    const result = await buildWorkflows();
    expect(result[0].workflows).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "SANGER_READ_RUN_FORWARD_FILE and SANGER_READ_RUN_REVERSE_FILE must both be present"
      )
    );
  });

  test("skips workflow with only reverse file variable", async () => {
    mockReadYamlFile.mockImplementation(async (path: string) => {
      if (path.includes("workflow_categories")) {
        return {
          workflow_categories: [
            {
              category: "ASSEMBLY",
              description: "d",
              name: "n",
              show_coming_soon: false,
            },
          ],
        };
      }
      return {
        workflows: [
          {
            ...BASE_SOURCE_WORKFLOW,
            parameters: [
              {
                key: "reverse",
                variable:
                  WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_REVERSE_FILE,
              },
            ],
          },
        ],
      };
    });

    const result = await buildWorkflows();
    expect(result[0].workflows).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "SANGER_READ_RUN_FORWARD_FILE and SANGER_READ_RUN_REVERSE_FILE must both be present"
      )
    );
  });

  test("includes workflow with neither forward nor reverse file variables", async () => {
    mockReadYamlFile.mockImplementation(async (path: string) => {
      if (path.includes("workflow_categories")) {
        return {
          workflow_categories: [
            {
              category: "ASSEMBLY",
              description: "d",
              name: "n",
              show_coming_soon: false,
            },
          ],
        };
      }
      return {
        workflows: [
          {
            ...BASE_SOURCE_WORKFLOW,
            parameters: [
              {
                key: "single",
                variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE,
              },
            ],
          },
        ],
      };
    });

    const result = await buildWorkflows();
    expect(result[0].workflows).toHaveLength(1);
    expect(result[0].workflows[0].parameters).toHaveLength(1);
  });
});
