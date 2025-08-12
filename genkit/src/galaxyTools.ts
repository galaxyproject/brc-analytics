import { z } from "genkit";
import { logger } from "@genkit-ai/core/logging";
import { ai } from "./ai";
import { galaxyMcpClient } from "./ai";

/**
 * Tool to get Galaxy server information
 */
export const getGalaxyServerInfoTool = ai.defineTool(
  {
    description: "Get information about the connected Galaxy server",
    inputSchema: z.object({}),
    name: "getGalaxyServerInfo",
    outputSchema: z
      .object({
        config: z.record(z.unknown()).describe("Server configuration"),
        url: z.string().describe("The URL of the Galaxy server"),
        version: z
          .object({
            version_major: z.string().optional(),
            version_minor: z.string().optional(),
          })
          .describe("Version information"),
      })
      .describe("Galaxy server information"),
  },
  async (): Promise<{
    config: Record<string, unknown>;
    url: string;
    version: { version_major?: string; version_minor?: string };
  }> => {
    try {
      // Use the Galaxy MCP client to get server information
      const response = (await galaxyMcpClient.call(
        "get_server_info",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
        {} as any
      )) as unknown as {
        config?: Record<string, unknown>;
        url?: string;
        version?: { version_major?: string; version_minor?: string };
      };

      // Create a properly typed object from the response
      const serverInfo = {
        config: response?.config || {},
        url: String(response?.url || ""),
        version: {
          version_major: response?.version?.version_major
            ? String(response.version.version_major)
            : undefined,
          version_minor: response?.version?.version_minor
            ? String(response.version.version_minor)
            : undefined,
        },
      };

      return serverInfo;
    } catch (error) {
      logger.error("Error getting Galaxy server info:", error);
      throw new Error(
        `Failed to get Galaxy server info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get Galaxy histories
 */
export const getGalaxyHistoriesTool = ai.defineTool(
  {
    description: "Get a list of histories from the Galaxy server",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .describe("Maximum number of histories to return (optional)"),
      offset: z
        .number()
        .optional()
        .describe("Offset for pagination (optional)"),
    }),
    name: "getGalaxyHistories",
    outputSchema: z
      .object({
        histories: z.array(
          z.object({
            deleted: z.boolean().describe("Whether the history is deleted"),
            id: z.string().describe("History ID"),
            name: z.string().describe("History name"),
            purged: z.boolean().describe("Whether the history is purged"),
            tags: z.array(z.string()).describe("History tags"),
            update_time: z.string().describe("Last update time"),
          })
        ),
        total: z.number().describe("Total number of histories"),
      })
      .describe("Galaxy histories information"),
  },
  async (input: {
    limit?: number;
    offset?: number;
  }): Promise<{
    histories: Array<{
      deleted: boolean;
      id: string;
      name: string;
      purged: boolean;
      tags: string[];
      update_time: string;
    }>;
    total: number;
  }> => {
    try {
      // Use the Galaxy MCP client to get histories
      const response = (await galaxyMcpClient.call("get_histories", {
        limit: input.limit,
        offset: input.offset,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        histories?: Array<{
          deleted?: boolean;
          id?: string;
          name?: string;
          purged?: boolean;
          tags?: string[];
          update_time?: string;
        }>;
        total?: number;
      };

      // Process the response to match our schema
      const histories = (response.histories || []).map((history) => ({
        deleted: Boolean(history.deleted),
        id: String(history.id || ""),
        name: String(history.name || ""),
        purged: Boolean(history.purged),
        tags: Array.isArray(history.tags) ? history.tags.map(String) : [],
        update_time: String(history.update_time || ""),
      }));

      return {
        histories,
        total: Number(response.total || 0),
      };
    } catch (error) {
      logger.error("Error getting Galaxy histories:", error);
      throw new Error(
        `Failed to get Galaxy histories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get Galaxy history details
 */
export const getHistoryDetailsTool = ai.defineTool(
  {
    description:
      "Get detailed information about a specific Galaxy history, including datasets",
    inputSchema: z.object({
      history_id: z.string().describe("ID of the history to get details for"),
    }),
    name: "getHistoryDetails",
    outputSchema: z
      .object({
        datasets: z.array(
          z.object({
            data_type: z.string().describe("Dataset data type"),
            deleted: z.boolean().describe("Whether the dataset is deleted"),
            file_ext: z.string().describe("Dataset file extension"),
            file_size: z.number().describe("Dataset file size in bytes"),
            history_id: z.string().describe("History ID"),
            id: z.string().describe("Dataset ID"),
            misc_blurb: z.string().describe("Miscellaneous dataset blurb"),
            misc_info: z.string().describe("Miscellaneous dataset information"),
            name: z.string().describe("Dataset name"),
            purged: z.boolean().describe("Whether the dataset is purged"),
            state: z.string().describe("Dataset state"),
            tags: z.array(z.string()).describe("Dataset tags"),
            visible: z.boolean().describe("Whether the dataset is visible"),
          })
        ),
      })
      .describe("Galaxy history details"),
  },
  async (input: {
    history_id: string;
  }): Promise<{
    datasets: Array<{
      data_type: string;
      deleted: boolean;
      file_ext: string;
      file_size: number;
      history_id: string;
      id: string;
      misc_blurb: string;
      misc_info: string;
      name: string;
      purged: boolean;
      state: string;
      tags: string[];
      visible: boolean;
    }>;
    deleted: boolean;
    id: string;
    name: string;
    purged: boolean;
    tags: string[];
    update_time: string;
  }> => {
    try {
      // Use the Galaxy MCP client to get history details
      const response = (await galaxyMcpClient.call("get_history_details", {
        history_id: input.history_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        datasets?: Array<{
          data_type?: string;
          deleted?: boolean;
          file_ext?: string;
          file_size?: number;
          history_id?: string;
          id?: string;
          misc_blurb?: string;
          misc_info?: string;
          name?: string;
          purged?: boolean;
          state?: string;
          tags?: string[];
          visible?: boolean;
        }>;
        deleted?: boolean;
        id?: string;
        name?: string;
        purged?: boolean;
        tags?: string[];
        update_time?: string;
      };

      // Process the response to match our schema
      const datasets = (response.datasets || []).map((dataset) => ({
        data_type: String(dataset.data_type || ""),
        deleted: Boolean(dataset.deleted),
        file_ext: String(dataset.file_ext || ""),
        file_size: Number(dataset.file_size || 0),
        history_id: String(dataset.history_id || ""),
        id: String(dataset.id || ""),
        misc_blurb: String(dataset.misc_blurb || ""),
        misc_info: String(dataset.misc_info || ""),
        name: String(dataset.name || ""),
        purged: Boolean(dataset.purged),
        state: String(dataset.state || ""),
        tags: Array.isArray(dataset.tags) ? dataset.tags.map(String) : [],
        visible: Boolean(dataset.visible),
      }));

      return {
        datasets,
        deleted: Boolean(response.deleted),
        id: String(response.id || ""),
        name: String(response.name || ""),
        purged: Boolean(response.purged),
        tags: Array.isArray(response.tags) ? response.tags.map(String) : [],
        update_time: String(response.update_time || ""),
      };
    } catch (error) {
      logger.error("Error getting Galaxy history details:", error);
      throw new Error(
        `Failed to get Galaxy history details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to search Galaxy tools
 */
export const searchGalaxyToolsTool = ai.defineTool(
  {
    description: "Search for tools in the Galaxy server by name",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Search query for finding tools by name or description"),
    }),
    name: "searchGalaxyTools",
    outputSchema: z
      .object({
        tools: z.array(
          z.object({
            config_file: z.string().describe("Tool configuration file path"),
            description: z.string().describe("Tool description"),
            id: z.string().describe("Tool ID"),
            name: z.string().describe("Tool name"),
            panel_section_name: z.string().describe("Tool panel section name"),
            version: z.string().describe("Tool version"),
          })
        ),
        total: z.number().describe("Total number of tools found"),
      })
      .describe("Galaxy tools search results"),
  },
  async (input: {
    query: string;
  }): Promise<{
    tools: Array<{
      config_file: string;
      description: string;
      id: string;
      name: string;
      panel_section_name: string;
      version: string;
    }>;
    total: number;
  }> => {
    try {
      // Use the Galaxy MCP client to search for tools
      const response = (await galaxyMcpClient.call("search_tools", {
        query: input.query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        tools?: Array<{
          config_file?: string;
          description?: string;
          id?: string;
          name?: string;
          panel_section_name?: string;
          version?: string;
        }>;
        total?: number;
      };

      // Process the response to match our schema
      const tools = (response.tools || []).map((tool) => ({
        config_file: String(tool.config_file || ""),
        description: String(tool.description || ""),
        id: String(tool.id || ""),
        name: String(tool.name || ""),
        panel_section_name: String(tool.panel_section_name || ""),
        version: String(tool.version || ""),
      }));

      return {
        tools,
        total: Number(response.total || 0),
      };
    } catch (error) {
      logger.error("Error searching Galaxy tools:", error);
      throw new Error(
        `Failed to search Galaxy tools: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to create a new Galaxy history
 */
export const createGalaxyHistoryTool = ai.defineTool(
  {
    description: "Create a new history in the Galaxy server",
    inputSchema: z.object({
      name: z.string().describe("Name for the new history"),
    }),
    name: "createGalaxyHistory",
    outputSchema: z
      .object({
        deleted: z.boolean().describe("Whether the history is deleted"),
        id: z.string().describe("ID of the created history"),
        name: z.string().describe("Name of the created history"),
        purged: z.boolean().describe("Whether the history is purged"),
        tags: z.array(z.string()).describe("History tags"),
        update_time: z.string().describe("Last update time"),
      })
      .describe("Created Galaxy history information"),
  },
  async (input: {
    name: string;
  }): Promise<{
    deleted: boolean;
    id: string;
    name: string;
    purged: boolean;
    tags: string[];
    update_time: string;
  }> => {
    try {
      // Use the Galaxy MCP client to create a new history
      const response = (await galaxyMcpClient.call("create_history", {
        name: input.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        deleted?: boolean;
        id?: string;
        name?: string;
        purged?: boolean;
        tags?: string[];
        update_time?: string;
      };

      // Process the response to match our schema
      return {
        deleted: Boolean(response.deleted),
        id: String(response.id || ""),
        name: String(response.name || ""),
        purged: Boolean(response.purged),
        tags: Array.isArray(response.tags) ? response.tags.map(String) : [],
        update_time: String(response.update_time || ""),
      };
    } catch (error) {
      logger.error("Error creating Galaxy history:", error);
      throw new Error(
        `Failed to create Galaxy history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to run a Galaxy tool
 */
export const runGalaxyToolTool = ai.defineTool(
  {
    description: "Run a tool in the Galaxy server",
    inputSchema: z.object({
      history_id: z.string().describe("ID of the history to run the tool in"),
      inputs: z
        .record(z.string(), z.unknown())
        .describe("Input parameters for the tool"),
      tool_id: z.string().describe("ID of the tool to run"),
    }),
    name: "runGalaxyTool",
    outputSchema: z
      .object({
        history_id: z.string().describe("ID of the history"),
        job_id: z.string().describe("ID of the created job"),
        output_ids: z.array(z.string()).describe("IDs of the output datasets"),
        tool_id: z.string().describe("ID of the tool"),
      })
      .describe("Galaxy tool run information"),
  },
  async (input: {
    history_id: string;
    inputs: Record<string, unknown>;
    tool_id: string;
  }): Promise<{
    history_id: string;
    job_id: string;
    output_ids: string[];
    tool_id: string;
  }> => {
    try {
      // Use the Galaxy MCP client to run a tool
      const response = (await galaxyMcpClient.call("run_tool", {
        history_id: input.history_id,
        inputs: input.inputs,
        tool_id: input.tool_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        history_id?: string;
        job_id?: string;
        output_ids?: string[];
        tool_id?: string;
      };

      // Process the response to match our schema
      return {
        history_id: String(response.history_id || ""),
        job_id: String(response.job_id || ""),
        output_ids: Array.isArray(response.output_ids)
          ? response.output_ids.map(String)
          : [],
        tool_id: String(response.tool_id || ""),
      };
    } catch (error) {
      logger.error("Error running Galaxy tool:", error);
      throw new Error(
        `Failed to run Galaxy tool: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get IWC workflows
 */
export const getIwcWorkflowsTool = ai.defineTool(
  {
    description: "Get workflows from the Interoperable Workflow Catalog (IWC)",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .describe("Optional limit on the number of workflows to return"),
      offset: z.number().optional().describe("Optional offset for pagination"),
    }),
    name: "getIwcWorkflows",
    outputSchema: z
      .object({
        total: z.number().describe("Total number of workflows"),
        workflows: z.array(
          z.object({
            authors: z.array(z.string()).describe("Authors of the workflow"),
            description: z.string().describe("Description of the workflow"),
            name: z.string().describe("Name of the workflow"),
            trs_id: z.string().describe("TRS ID of the workflow"),
            version: z.string().describe("Version of the workflow"),
          })
        ),
      })
      .describe("IWC workflows information"),
  },
  async (input: {
    limit?: number;
    offset?: number;
  }): Promise<{
    total: number;
    workflows: Array<{
      authors: string[];
      description: string;
      name: string;
      trs_id: string;
      version: string;
    }>;
  }> => {
    try {
      // Use the Galaxy MCP client to get IWC workflows
      const response = (await galaxyMcpClient.call("get_iwc_workflows", {
        limit: input.limit,
        offset: input.offset,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        total?: number;
        workflows?: Array<{
          authors?: string[];
          description?: string;
          name?: string;
          tags?: string[];
          trs_id?: string;
          version?: string;
        }>;
      };

      // Process the response to match our schema
      const workflows = (response.workflows || []).map((workflow) => ({
        authors: Array.isArray(workflow.authors)
          ? workflow.authors.map(String)
          : [],
        description: String(workflow.description || ""),
        name: String(workflow.name || ""),
        trs_id: String(workflow.trs_id || ""),
        version: String(workflow.version || ""),
      }));

      return {
        total: Number(response.total || 0),
        workflows,
      };
    } catch (error) {
      logger.error("Error getting IWC workflows:", error);
      throw new Error(
        `Failed to get IWC workflows: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to search for workflows in the Interoperable Workflow Catalog (IWC)
 */
export const searchIwcWorkflowsTool = ai.defineTool(
  {
    description:
      "Search for workflows in the Interoperable Workflow Catalog (IWC)",
    inputSchema: z.object({
      query: z.string().describe("Search query"),
    }),
    name: "searchIwcWorkflows",
    outputSchema: z
      .object({
        count: z.number().describe("Total number of matching workflows"),
        workflows: z
          .array(
            z.object({
              authors: z
                .array(z.string())
                .optional()
                .describe("Workflow authors"),
              description: z
                .string()
                .optional()
                .describe("Workflow description"),
              name: z.string().describe("Workflow name"),
              tags: z.array(z.string()).optional().describe("Workflow tags"),
              trs_id: z.string().describe("TRS ID of the workflow"),
            })
          )
          .describe("List of matching IWC workflows"),
      })
      .describe("IWC workflow search results"),
  },
  async (input: {
    query: string;
  }): Promise<{
    count: number;
    workflows: Array<{
      authors?: string[];
      description?: string;
      name: string;
      tags?: string[];
      trs_id: string;
    }>;
  }> => {
    try {
      // Use the Galaxy MCP client to search for IWC workflows
      const response = (await galaxyMcpClient.call("search_iwc_workflows", {
        query: input.query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        count?: number;
        workflows?: Array<{
          authors?: string[];
          description?: string;
          name?: string;
          tags?: string[];
          trs_id?: string;
        }>;
      };

      // Process the response to match our schema
      const workflows = (response.workflows || []).map((workflow) => ({
        authors: workflow.authors,
        description: workflow.description,
        name: String(workflow.name || ""),
        tags: workflow.tags,
        trs_id: String(workflow.trs_id || ""),
      }));

      return {
        count: Number(response.count || 0),
        workflows,
      };
    } catch (error) {
      logger.error("Error searching IWC workflows:", error);
      throw new Error(
        `Failed to search IWC workflows: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to import a workflow from the Interoperable Workflow Catalog (IWC) to Galaxy
 */
export const importWorkflowFromIwcTool = ai.defineTool(
  {
    description:
      "Import a workflow from the Interoperable Workflow Catalog (IWC) to Galaxy",
    inputSchema: z.object({
      trs_id: z.string().describe("TRS ID of the workflow to import"),
    }),
    name: "importWorkflowFromIwc",
    outputSchema: z
      .object({
        id: z.string().describe("ID of the imported workflow"),
        name: z.string().describe("Name of the imported workflow"),
        tags: z
          .array(z.string())
          .optional()
          .describe("Tags of the imported workflow"),
      })
      .describe("Imported workflow details"),
  },
  async (input: {
    trs_id: string;
  }): Promise<{
    id: string;
    name: string;
    tags?: string[];
  }> => {
    try {
      // Use the Galaxy MCP client to import a workflow from IWC
      const response = (await galaxyMcpClient.call("import_workflow_from_iwc", {
        trs_id: input.trs_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        id?: string;
        name?: string;
        tags?: string[];
      };

      // Process the response to match our schema
      const result = {
        id: String(response?.id || ""),
        name: String(response?.name || ""),
        tags: Array.isArray(response?.tags)
          ? response.tags.map(String)
          : undefined,
      };

      return result;
    } catch (error) {
      logger.error("Error importing workflow from IWC:", error);
      throw new Error(
        `Failed to import workflow from IWC: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get detailed information about a specific Galaxy job
 */
export const getGalaxyJobDetailsTool = ai.defineTool(
  {
    description: "Get detailed information about a specific Galaxy job",
    inputSchema: z.object({
      job_id: z.string().describe("ID of the job to get details for"),
    }),
    name: "getGalaxyJobDetails",
    outputSchema: z
      .object({
        job: z
          .object({
            create_time: z
              .string()
              .optional()
              .describe("Time when the job was created"),
            exit_code: z.number().optional().describe("Exit code of the job"),
            history_id: z
              .string()
              .optional()
              .describe("ID of the history containing this job"),
            id: z.string().describe("The unique identifier of the job"),
            state: z
              .string()
              .describe(
                'Current state of the job (e.g., "new", "running", "ok", "error")'
              ),
            tool_id: z.string().describe("ID of the tool that was run"),
            tool_version: z
              .string()
              .optional()
              .describe("Version of the tool that was run"),
            update_time: z
              .string()
              .optional()
              .describe("Time when the job was last updated"),
          })
          .describe("Job information"),
      })
      .describe("Galaxy job details"),
  },
  async (input: {
    job_id: string;
  }): Promise<{
    job: {
      create_time?: string;
      exit_code?: number;
      history_id?: string;
      id: string;
      state: string;
      tool_id: string;
      tool_version?: string;
      update_time?: string;
    };
  }> => {
    try {
      // Use the Galaxy MCP client to get job details
      const response = (await galaxyMcpClient.call("get_job_details", {
        job_id: input.job_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        job?: {
          create_time?: string;
          exit_code?: number;
          history_id?: string;
          id?: string;
          state?: string;
          tool_id?: string;
          tool_version?: string;
          update_time?: string;
        };
      };

      // Process the response to match our schema
      const result = {
        job: {
          create_time: response?.job?.create_time
            ? String(response.job.create_time)
            : undefined,
          exit_code:
            typeof response?.job?.exit_code === "number"
              ? response.job.exit_code
              : undefined,
          history_id: response?.job?.history_id
            ? String(response.job.history_id)
            : undefined,
          id: String(response?.job?.id || ""),
          state: String(response?.job?.state || ""),
          tool_id: String(response?.job?.tool_id || ""),
          tool_version: response?.job?.tool_version
            ? String(response.job.tool_version)
            : undefined,
          update_time: response?.job?.update_time
            ? String(response.job.update_time)
            : undefined,
        },
      };

      return result;
    } catch (error) {
      logger.error("Error getting Galaxy job details:", error);
      throw new Error(
        `Failed to get Galaxy job details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to upload a local file to Galaxy
 */
export const uploadFileToGalaxyTool = ai.defineTool(
  {
    description: "Upload a local file to Galaxy",
    inputSchema: z.object({
      history_id: z
        .string()
        .optional()
        .describe("Target history ID (optional)"),
      path: z.string().describe("Path to local file to upload"),
    }),
    name: "uploadFileToGalaxy",
    outputSchema: z
      .object({
        file_ext: z
          .string()
          .optional()
          .describe("File extension of the uploaded file"),
        file_size: z
          .number()
          .optional()
          .describe("Size of the uploaded file in bytes"),
        history_id: z
          .string()
          .describe("ID of the history containing the uploaded dataset"),
        id: z.string().describe("ID of the uploaded dataset"),
        name: z.string().describe("Name of the uploaded dataset"),
        state: z.string().describe("State of the uploaded dataset"),
      })
      .describe("Upload status"),
  },
  async (input: {
    history_id?: string;
    path: string;
  }): Promise<{
    file_ext?: string;
    file_size?: number;
    history_id: string;
    id: string;
    name: string;
    state: string;
  }> => {
    try {
      // Use the Galaxy MCP client to upload a file
      const response = (await galaxyMcpClient.call("upload_file", {
        history_id: input.history_id,
        path: input.path,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        file_ext?: string;
        file_size?: number;
        history_id?: string;
        id?: string;
        name?: string;
        state?: string;
      };

      // Process the response to match our schema
      const result = {
        file_ext: response?.file_ext ? String(response.file_ext) : undefined,
        file_size:
          typeof response?.file_size === "number"
            ? response.file_size
            : undefined,
        history_id: String(response?.history_id || ""),
        id: String(response?.id || ""),
        name: String(response?.name || ""),
        state: String(response?.state || ""),
      };

      return result;
    } catch (error) {
      logger.error("Error uploading file to Galaxy:", error);
      throw new Error(
        `Failed to upload file to Galaxy: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to filter Galaxy tools by dataset type
 */
export const filterToolsByDatasetTool = ai.defineTool(
  {
    description:
      "Filter Galaxy tools that are potentially suitable for a given dataset type",
    inputSchema: z.object({
      dataset_type: z
        .array(z.string())
        .describe(
          'A list of keywords or phrases describing the dataset type (e.g., ["csv", "tabular"])'
        ),
    }),
    name: "filterToolsByDataset",
    outputSchema: z
      .object({
        count: z.number().describe("Total number of tools found"),
        tools: z
          .array(
            z.object({
              description: z
                .string()
                .optional()
                .describe("The description of the tool"),
              id: z.string().describe("The unique identifier of the tool"),
              name: z.string().describe("The name of the tool"),
              panel_section_name: z
                .string()
                .optional()
                .describe("The panel section where the tool appears"),
              version: z
                .string()
                .optional()
                .describe("The version of the tool"),
            })
          )
          .describe("List of tools suitable for the dataset type"),
      })
      .describe("Galaxy tools filtered by dataset type"),
  },
  async (input: {
    dataset_type: string[];
  }): Promise<{
    count: number;
    tools: Array<{
      description?: string;
      id: string;
      name: string;
      panel_section_name?: string;
      version?: string;
    }>;
  }> => {
    try {
      // Use the Galaxy MCP client to filter tools by dataset type
      const response = (await galaxyMcpClient.call("filter_tools_by_dataset", {
        dataset_type: input.dataset_type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        count?: number;
        tools?: Array<{
          description?: string;
          id?: string;
          name?: string;
          panel_section_name?: string;
          version?: string;
        }>;
      };

      // Process the response to match our schema
      const result = {
        count: typeof response?.count === "number" ? response.count : 0,
        tools: Array.isArray(response?.tools)
          ? response.tools.map((tool) => ({
              description: tool?.description
                ? String(tool.description)
                : undefined,
              id: String(tool?.id || ""),
              name: String(tool?.name || ""),
              panel_section_name: tool?.panel_section_name
                ? String(tool.panel_section_name)
                : undefined,
              version: tool?.version ? String(tool.version) : undefined,
            }))
          : [],
      };

      return result;
    } catch (error) {
      logger.error("Error filtering Galaxy tools by dataset type:", error);
      throw new Error(
        `Failed to filter Galaxy tools by dataset type: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get Galaxy workflow invocations
 */
export const getGalaxyInvocationsTool = ai.defineTool(
  {
    description: "View workflow invocations in Galaxy",
    inputSchema: z.object({
      history_id: z
        .string()
        .optional()
        .describe("Filter invocations by history ID (optional)"),
      invocation_id: z
        .string()
        .optional()
        .describe("Specific invocation ID to view details (optional)"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of invocations to return (optional)"),
      step_details: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'Include details on individual steps (only if view is "element")'
        ),
      view: z
        .enum(["element", "collection"])
        .optional()
        .default("collection")
        .describe("Level of detail to return (default: collection)"),
      workflow_id: z
        .string()
        .optional()
        .describe("Filter invocations by workflow ID (optional)"),
    }),
    name: "getGalaxyInvocations",
    outputSchema: z
      .object({
        invocation: z
          .object({
            create_time: z
              .string()
              .optional()
              .describe("Time when the invocation was created"),
            history_id: z
              .string()
              .describe("ID of the history where the invocation was run"),
            id: z.string().describe("The unique identifier of the invocation"),
            state: z.string().describe("Current state of the invocation"),
            steps: z
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
              .array(z.any())
              .optional()
              .describe("Steps in the invocation (if step_details is true)"),
            update_time: z
              .string()
              .optional()
              .describe("Time when the invocation was last updated"),
            workflow_id: z
              .string()
              .describe("ID of the workflow that was invoked"),
          })
          .optional()
          .describe(
            "Specific invocation details (if invocation_id was provided)"
          ),
        invocations: z
          .array(
            z.object({
              create_time: z
                .string()
                .optional()
                .describe("Time when the invocation was created"),
              history_id: z
                .string()
                .describe("ID of the history where the invocation was run"),
              id: z
                .string()
                .describe("The unique identifier of the invocation"),
              state: z.string().describe("Current state of the invocation"),
              update_time: z
                .string()
                .optional()
                .describe("Time when the invocation was last updated"),
              workflow_id: z
                .string()
                .describe("ID of the workflow that was invoked"),
            })
          )
          .optional()
          .describe("List of invocations (if invocation_id was not provided)"),
      })
      .describe("Galaxy workflow invocation(s) information"),
  },
  async (input: {
    history_id?: string;
    invocation_id?: string;
    limit?: number;
    step_details?: boolean;
    view?: "element" | "collection";
    workflow_id?: string;
  }): Promise<{
    invocation?: {
      create_time?: string;
      history_id: string;
      id: string;
      state: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      steps?: any[];
      update_time?: string;
      workflow_id: string;
    };
    invocations?: Array<{
      create_time?: string;
      history_id: string;
      id: string;
      state: string;
      update_time?: string;
      workflow_id: string;
    }>;
  }> => {
    try {
      // Use the Galaxy MCP client to get workflow invocations
      const response = (await galaxyMcpClient.call("get_invocations", {
        history_id: input.history_id,
        invocation_id: input.invocation_id,
        limit: input.limit,
        step_details: input.step_details || false,
        view: input.view || "collection",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        invocation?: {
          create_time?: string;
          history_id?: string;
          id?: string;
          state?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
          steps?: any[];
          update_time?: string;
          workflow_id?: string;
        };
        invocations?: Array<{
          create_time?: string;
          history_id?: string;
          id?: string;
          state?: string;
          update_time?: string;
          workflow_id?: string;
        }>;
      };

      // Process the response to match our schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      const result: any = {};

      if (response?.invocation) {
        result.invocation = {
          create_time: response.invocation.create_time
            ? String(response.invocation.create_time)
            : undefined,
          history_id: String(response.invocation.history_id || ""),
          id: String(response.invocation.id || ""),
          state: String(response.invocation.state || ""),
          steps: response.invocation.steps || undefined,
          update_time: response.invocation.update_time
            ? String(response.invocation.update_time)
            : undefined,
          workflow_id: String(response.invocation.workflow_id || ""),
        };
      }

      if (response?.invocations) {
        result.invocations = response.invocations.map((inv) => ({
          create_time: inv?.create_time ? String(inv.create_time) : undefined,
          history_id: String(inv?.history_id || ""),
          id: String(inv?.id || ""),
          state: String(inv?.state || ""),
          update_time: inv?.update_time ? String(inv.update_time) : undefined,
          workflow_id: String(inv?.workflow_id || ""),
        }));
      }

      return result;
    } catch (error) {
      logger.error("Error getting Galaxy workflow invocations:", error);
      throw new Error(
        `Failed to get Galaxy workflow invocations: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get current Galaxy user information
 */
export const getGalaxyUserTool = ai.defineTool(
  {
    description: "Get information about the current Galaxy user",
    inputSchema: z.object({}),
    name: "getGalaxyUser",
    outputSchema: z
      .object({
        email: z.string().describe("User email address"),
        id: z.string().describe("User ID"),
        is_active: z
          .boolean()
          .optional()
          .describe("Whether the user account is active"),
        is_admin: z
          .boolean()
          .optional()
          .describe("Whether the user is an admin"),
        nice_total_disk_usage: z
          .string()
          .optional()
          .describe("Human-readable disk usage"),
        preferences: z.record(z.any()).optional().describe("User preferences"),
        quota_percent: z
          .number()
          .optional()
          .describe("Percentage of quota used"),
        total_disk_usage: z
          .number()
          .optional()
          .describe("Total disk usage in bytes"),
        username: z.string().optional().describe("Username"),
      })
      .describe("Galaxy user information"),
  },
  async (): Promise<{
    email: string;
    id: string;
    is_active?: boolean;
    is_admin?: boolean;
    nice_total_disk_usage?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
    preferences?: Record<string, any>;
    quota_percent?: number;
    total_disk_usage?: number;
    username?: string;
  }> => {
    try {
      // Use the Galaxy MCP client to get current user information
      const response = (await galaxyMcpClient.call(
        "get_user",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
        {} as any
      )) as unknown as {
        email?: string;
        id?: string;
        is_active?: boolean;
        is_admin?: boolean;
        nice_total_disk_usage?: string;
        preferences?: Record<string, unknown>;
        quota_percent?: number;
        total_disk_usage?: number;
        username?: string;
      };

      // Process the response to match our schema
      const result = {
        email: String(response?.email || ""),
        id: String(response?.id || ""),
        is_active:
          typeof response?.is_active === "boolean"
            ? response.is_active
            : undefined,
        is_admin:
          typeof response?.is_admin === "boolean"
            ? response.is_admin
            : undefined,
        nice_total_disk_usage: response?.nice_total_disk_usage
          ? String(response.nice_total_disk_usage)
          : undefined,
        preferences: response?.preferences || undefined,
        quota_percent:
          typeof response?.quota_percent === "number"
            ? response.quota_percent
            : undefined,
        total_disk_usage:
          typeof response?.total_disk_usage === "number"
            ? response.total_disk_usage
            : undefined,
        username: response?.username ? String(response.username) : undefined,
      };

      return result;
    } catch (error) {
      logger.error("Error getting Galaxy user information:", error);
      throw new Error(
        `Failed to get Galaxy user information: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get citation information for a Galaxy tool
 */
export const getGalaxyToolCitationsTool = ai.defineTool(
  {
    description: "Get citation information for a specific Galaxy tool",
    inputSchema: z.object({
      tool_id: z.string().describe("ID of the tool to get citations for"),
    }),
    name: "getGalaxyToolCitations",
    outputSchema: z
      .object({
        citations: z
          .array(
            z.object({
              authors: z
                .string()
                .optional()
                .describe("Authors of the citation"),
              doi: z.string().optional().describe("Digital Object Identifier"),
              title: z.string().optional().describe("Title of the citation"),
              type: z.string().optional().describe("Type of citation"),
              url: z.string().optional().describe("URL to the publication"),
              year: z.string().optional().describe("Year of publication"),
            })
          )
          .describe("List of citations for the tool"),
        tool_name: z.string().describe("Name of the tool"),
        tool_version: z.string().describe("Version of the tool"),
      })
      .describe("Galaxy tool citation information"),
  },
  async (input: {
    tool_id: string;
  }): Promise<{
    citations: Array<{
      authors?: string;
      doi?: string;
      title?: string;
      type?: string;
      url?: string;
      year?: string;
    }>;
    tool_name: string;
    tool_version: string;
  }> => {
    try {
      // Use the Galaxy MCP client to get tool citations
      const response = (await galaxyMcpClient.call("get_tool_citations", {
        tool_id: input.tool_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as unknown as {
        citations?: Array<{
          authors?: string;
          doi?: string;
          title?: string;
          type?: string;
          url?: string;
          year?: string;
        }>;
        tool_name?: string;
        tool_version?: string;
      };

      // Process the response to match our schema
      const result = {
        citations: Array.isArray(response?.citations)
          ? response.citations.map((citation) => ({
              authors: citation?.authors ? String(citation.authors) : undefined,
              doi: citation?.doi ? String(citation.doi) : undefined,
              title: citation?.title ? String(citation.title) : undefined,
              type: citation?.type ? String(citation.type) : undefined,
              url: citation?.url ? String(citation.url) : undefined,
              year: citation?.year ? String(citation.year) : undefined,
            }))
          : [],
        tool_name: String(response?.tool_name || ""),
        tool_version: String(response?.tool_version || ""),
      };

      return result;
    } catch (error) {
      logger.error("Error getting Galaxy tool citations:", error);
      throw new Error(
        `Failed to get Galaxy tool citations: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get a simplified list of history IDs and names
 */
export const listGalaxyHistoryIdsTool = ai.defineTool(
  {
    description:
      "Get a simplified list of Galaxy history IDs and names for easy reference",
    inputSchema: z.object({}),
    name: "listGalaxyHistoryIds",
    outputSchema: z
      .array(
        z.object({
          id: z.string().describe("History ID"),
          name: z.string().describe("History name"),
        })
      )
      .describe("List of Galaxy histories with IDs and names"),
  },
  async (): Promise<
    Array<{
      id: string;
      name: string;
    }>
  > => {
    try {
      // Use the Galaxy MCP client to get simplified history list
      const response = (await galaxyMcpClient.call(
        "list_history_ids",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
        {} as any
      )) as unknown as Array<{ id: string; name: string }>;

      // Process the response to match our schema
      if (!Array.isArray(response)) {
        return [];
      }

      // Map the response to our schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      const result = response.map((history: any) => ({
        id: String(history?.id || ""),
        name: String(history?.name || "Unnamed"),
      }));

      return result;
    } catch (error) {
      logger.error("Error listing Galaxy history IDs:", error);
      throw new Error(
        `Failed to list Galaxy history IDs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get detailed information about a specific Galaxy tool
 */
export const getGalaxyToolDetailsTool = ai.defineTool(
  {
    description: "Get detailed information about a specific Galaxy tool",
    inputSchema: z.object({
      io_details: z
        .boolean()
        .optional()
        .describe("Whether to include input/output details (default: false)"),
      tool_id: z.string().describe("ID of the tool to get details for"),
    }),
    name: "getGalaxyToolDetails",
    outputSchema: z
      .object({
        description: z.string().optional().describe("Tool description"),
        id: z.string().describe("Tool ID"),
        inputs: z
          .array(
            z.object({
              help: z.string().optional().describe("Input help text"),
              label: z.string().optional().describe("Input label"),
              name: z.string().describe("Input name"),
              optional: z
                .boolean()
                .optional()
                .describe("Whether the input is optional"),
              type: z.string().optional().describe("Input type"),
            })
          )
          .optional()
          .describe("Tool inputs (only if io_details is true)"),
        name: z.string().describe("Tool name"),
        outputs: z
          .array(
            z.object({
              format: z.string().optional().describe("Output format"),
              label: z.string().optional().describe("Output label"),
              name: z.string().describe("Output name"),
            })
          )
          .optional()
          .describe("Tool outputs (only if io_details is true)"),
        panel_section_id: z
          .string()
          .optional()
          .describe("Tool panel section ID"),
        panel_section_name: z
          .string()
          .optional()
          .describe("Tool panel section name"),
        version: z.string().optional().describe("Tool version"),
      })
      .describe("Galaxy tool details"),
  },
  async (input: {
    io_details?: boolean;
    tool_id: string;
  }): Promise<{
    description?: string;
    id: string;
    inputs?: Array<{
      help?: string;
      label?: string;
      name: string;
      optional?: boolean;
      type?: string;
    }>;
    name: string;
    outputs?: Array<{
      format?: string;
      label?: string;
      name: string;
    }>;
    panel_section_id?: string;
    panel_section_name?: string;
    version?: string;
  }> => {
    try {
      // Use the Galaxy MCP client to get tool details
      const response = (await galaxyMcpClient.call("get_tool_details", {
        io_details: input.io_details === true,
        tool_id: input.tool_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      } as any)) as any;

      // Process the response to match our schema
      const result: {
        description?: string;
        id: string;
        inputs?: Array<{
          help?: string;
          label?: string;
          name: string;
          optional?: boolean;
          type?: string;
        }>;
        name: string;
        outputs?: Array<{
          format?: string;
          label?: string;
          name: string;
        }>;
        panel_section_id?: string;
        panel_section_name?: string;
        version?: string;
      } = {
        description: response?.description
          ? String(response.description)
          : undefined,
        id: String(response?.id || ""),
        name: String(response?.name || ""),
        panel_section_id: response?.panel_section_id
          ? String(response.panel_section_id)
          : undefined,
        panel_section_name: response?.panel_section_name
          ? String(response.panel_section_name)
          : undefined,
        version: response?.version ? String(response.version) : undefined,
      };

      // Add inputs and outputs if io_details was requested
      if (input.io_details === true) {
        if (Array.isArray(response?.inputs)) {
          result.inputs = response.inputs.map(
            (inputItem: Record<string, unknown>) => ({
              help: inputItem?.help ? String(inputItem.help) : undefined,
              label: inputItem?.label ? String(inputItem.label) : undefined,
              name: String(inputItem?.name || ""),
              optional:
                typeof inputItem?.optional === "boolean"
                  ? inputItem.optional
                  : undefined,
              type: inputItem?.type ? String(inputItem.type) : undefined,
            })
          );
        }

        if (Array.isArray(response?.outputs)) {
          result.outputs = response.outputs.map(
            (output: Record<string, unknown>) => ({
              format: output?.format ? String(output.format) : undefined,
              label: output?.label ? String(output.label) : undefined,
              name: String(output?.name || ""),
            })
          );
        }
      }

      return result;
    } catch (error) {
      logger.error("Error getting Galaxy tool details:", error);
      throw new Error(
        `Failed to get Galaxy tool details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get the tool panel structure from Galaxy
 */
export const getGalaxyToolPanelTool = ai.defineTool(
  {
    description: "Get the tool panel structure (toolbox) from Galaxy",
    inputSchema: z.object({}),
    name: "getGalaxyToolPanel",
    outputSchema: z
      .object({
        tool_panel: z
          .array(
            z.object({
              elems: z
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
                .array(z.any())
                .optional()
                .describe("Section elements (tools or subsections)"),
              id: z.string().optional().describe("Section ID"),
              model_class: z.string().optional().describe("Model class"),
              name: z.string().optional().describe("Section name"),
            })
          )
          .describe("Tool panel sections"),
      })
      .describe("Galaxy tool panel structure"),
  },
  async (): Promise<{
    tool_panel: Array<{
      elems?: Array<unknown>;
      id?: string;
      model_class?: string;
      name?: string;
    }>;
  }> => {
    try {
      // Use the Galaxy MCP client to get the tool panel
      const response = (await galaxyMcpClient.call(
        "get_tool_panel",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
        {} as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
      )) as any;

      // Process the response to match our schema
      const result = {
        tool_panel: Array.isArray(response?.tool_panel)
          ? response.tool_panel
          : [],
      };

      return result;
    } catch (error) {
      logger.error("Error getting Galaxy tool panel:", error);
      throw new Error(
        `Failed to get Galaxy tool panel: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

// Export all Galaxy tools as an array
export const galaxyTools = [
  getGalaxyServerInfoTool,
  getGalaxyHistoriesTool,
  getHistoryDetailsTool,
  searchGalaxyToolsTool,
  createGalaxyHistoryTool,
  runGalaxyToolTool,
  getIwcWorkflowsTool,
  searchIwcWorkflowsTool,
  importWorkflowFromIwcTool,
  getGalaxyJobDetailsTool,
  uploadFileToGalaxyTool,
  filterToolsByDatasetTool,
  getGalaxyInvocationsTool,
  getGalaxyUserTool,
  getGalaxyToolCitationsTool,
  listGalaxyHistoryIdsTool,
  getGalaxyToolDetailsTool,
  getGalaxyToolPanelTool,
  // Additional tools can be added here
];
