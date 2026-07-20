import { WORKFLOW_SCOPE } from "@brc-analytics/core/apis/schema-types";
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
  categories: ["ASSEMBLY"],
  iwc_id: "test-iwc",
  parameters: [],
  ploidy: "ANY",
  trs_id: "#test/trs",
  workflow_description: "test workflow",
  workflow_name: "Test Workflow",
};

describe("buildWorkflows - assembly count resolution", () => {
  beforeEach(() => {
    mockReadYamlFile.mockReset();
  });

  test("ASSEMBLY scope defaults to min 1 / max 1", async () => {
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
            scope: "ASSEMBLY",
          },
        ],
      };
    });

    const result = await buildWorkflows();
    const wf = result[0].workflows[0];
    expect(wf.assemblyCountMin).toBe(1);
    expect(wf.assemblyCountMax).toBe(1);
    expect(wf.scope).toBe(WORKFLOW_SCOPE.ASSEMBLY);
  });

  test("ASSEMBLY scope with explicit values uses them", async () => {
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
            assembly_count_max: 10,
            assembly_count_min: 3,
            scope: "ASSEMBLY",
          },
        ],
      };
    });

    const result = await buildWorkflows();
    const wf = result[0].workflows[0];
    expect(wf.assemblyCountMin).toBe(3);
    expect(wf.assemblyCountMax).toBe(10);
  });

  test("ORGANISM scope passes through explicit min/max", async () => {
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
            assembly_count_max: 0,
            assembly_count_min: 0,
            scope: "ORGANISM",
          },
        ],
      };
    });

    const result = await buildWorkflows();
    const wf = result[0].workflows[0];
    expect(wf.assemblyCountMin).toBe(0);
    expect(wf.assemblyCountMax).toBe(0);
    expect(wf.scope).toBe(WORKFLOW_SCOPE.ORGANISM);
  });

  test("ORGANISM scope with no max defaults to null (unbounded)", async () => {
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
            assembly_count_min: 2,
            scope: "ORGANISM",
          },
        ],
      };
    });

    const result = await buildWorkflows();
    const wf = result[0].workflows[0];
    expect(wf.assemblyCountMin).toBe(2);
    expect(wf.assemblyCountMax).toBeNull();
  });

  test("ORGANISM scope missing assembly_count_min throws", async () => {
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
            scope: "ORGANISM",
          },
        ],
      };
    });

    await expect(buildWorkflows()).rejects.toThrow(
      /assembly_count_min is required/
    );
  });

  test("no scope defaults to ASSEMBLY with 1/1", async () => {
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
        workflows: [BASE_SOURCE_WORKFLOW],
      };
    });

    const result = await buildWorkflows();
    const wf = result[0].workflows[0];
    expect(wf.assemblyCountMin).toBe(1);
    expect(wf.assemblyCountMax).toBe(1);
    expect(wf.scope).toBe(WORKFLOW_SCOPE.ASSEMBLY);
  });
});
