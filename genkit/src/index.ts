import { z } from "genkit";
import { logger } from "@genkit-ai/core/logging";
import { dataStore } from "./dataStore";
import { ai } from "./ai";
import { ncbiTools } from "./ncbiTools";
import { galaxyTools } from "./galaxyTools";
import { FileSessionStore } from "./sessionStore";

// Initialize session store for chat message history
const sessionStore = new FileSessionStore("./data/sessions");

// Define schemas for common inputs
const SessionIdSchema = z.string().describe("Session ID for chat history");

// Tool: Get BRC Organisms
export const getOrganisms = ai.defineTool(
  {
    description: "Get a list of all organisms in the BRC Analytics catalog",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .describe("Optional limit on the number of organisms to return"),
      offset: z.number().optional().describe("Optional offset for pagination"),
    }),
    name: "brc_get_organisms",
    outputSchema: z.object({
      organisms: z.array(
        z.object({
          assemblyCount: z.number(),
          commonName: z.string().nullable(),
          taxonomicGroup: z.array(z.string()),
          taxonomicLevelClass: z.string(),
          taxonomicLevelDomain: z.string(),
          taxonomicLevelFamily: z.string(),
          taxonomicLevelGenus: z.string(),
          taxonomicLevelOrder: z.string(),
          taxonomicLevelPhylum: z.string(),
          taxonomicLevelSpecies: z.string(),
          taxonomicLevelStrain: z.string().nullable(),
          taxonomyId: z.string(),
        })
      ),
      total: z.number(),
    }),
  },
  async (input: { limit?: number; offset?: number }) => {
    try {
      const organisms = await dataStore.getOrganisms();
      const limit = input.limit || organisms.length;
      const offset = input.offset || 0;

      const paginatedOrganisms = organisms
        .slice(offset, offset + limit)
        .map((org) => {
          // Get the first genome for each organism to extract taxonomy info
          const genome = org.genomes[0];
          return {
            assemblyCount: org.assemblyCount,
            commonName: genome.commonName,
            taxonomicGroup: genome.taxonomicGroup,
            taxonomicLevelClass: genome.taxonomicLevelClass,
            taxonomicLevelDomain: genome.taxonomicLevelDomain,
            taxonomicLevelFamily: genome.taxonomicLevelFamily,
            taxonomicLevelGenus: genome.taxonomicLevelGenus,
            taxonomicLevelOrder: genome.taxonomicLevelOrder,
            taxonomicLevelPhylum: genome.taxonomicLevelPhylum,
            taxonomicLevelSpecies: genome.taxonomicLevelSpecies,
            taxonomicLevelStrain: genome.taxonomicLevelStrain || null,
            taxonomyId: genome.ncbiTaxonomyId,
          };
        });

      return {
        organisms: paginatedOrganisms,
        total: organisms.length,
      };
    } catch (error) {
      logger.error("Error in getOrganisms:", error);
      throw error;
    }
  }
);

// Tool: Get BRC Organism Details
export const getOrganismDetails = ai.defineTool(
  {
    description:
      "Get detailed information about a specific organism by taxonomy ID from the BRC Analytics catalog",
    inputSchema: z.object({
      taxonomy_id: z.string().describe("NCBI Taxonomy ID of the organism"),
    }),
    name: "brc_get_organism_details",
    outputSchema: z.object({
      error: z.string().optional(),
      organism: z
        .object({
          assemblyCount: z.number(),
          commonName: z.string().nullable(),
          genomes: z.array(
            z.object({
              accession: z.string(),
              gcPercent: z.number().nullable(),
              isRef: z.string(),
              length: z.number(),
              strainName: z.string().nullable(),
            })
          ),
          taxonomicGroup: z.array(z.string()),
          taxonomyId: z.string(),
        })
        .nullable(),
    }),
  },
  async (input: { taxonomy_id: string }) => {
    try {
      const organism = await dataStore.getOrganismByTaxonomyId(
        input.taxonomy_id
      );

      if (!organism) {
        return {
          error: `Organism with taxonomy ID ${input.taxonomy_id} not found`,
          organism: null,
        };
      }

      // Get the first genome for each organism to extract taxonomy info
      const genome = organism.genomes[0];

      return {
        organism: {
          assemblyCount: organism.assemblyCount,
          commonName: genome.commonName,
          genomes: organism.genomes.map((g) => ({
            accession: g.accession,
            gcPercent: g.gcPercent,
            isRef: g.isRef,
            length: g.length,
            strainName: g.strainName,
          })),
          taxonomicGroup: genome.taxonomicGroup,
          taxonomyId: genome.ncbiTaxonomyId,
        },
      };
    } catch (error) {
      logger.error("Error in getOrganismDetails:", error);
      return {
        error: `Error retrieving organism: ${error instanceof Error ? error.message : String(error)}`,
        organism: null,
      };
    }
  }
);

// Tool: Get BRC Assemblies
export const getAssemblies = ai.defineTool(
  {
    description: "Get a list of all assemblies in the BRC Analytics catalog",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .describe("Optional limit on the number of assemblies to return"),
      offset: z.number().optional().describe("Optional offset for pagination"),
      taxonomy_id: z
        .string()
        .optional()
        .describe("Optional taxonomy ID to filter assemblies"),
    }),
    name: "brc_get_assemblies",
    outputSchema: z.object({
      assemblies: z.array(
        z.object({
          accession: z.string(),
          gcPercent: z.number().nullable(),
          isRef: z.string(),
          length: z.number(),
          strainName: z.string().nullable(),
          taxonomyId: z.string(),
        })
      ),
      total: z.number(),
    }),
  },
  async (input: { limit?: number; offset?: number; taxonomy_id?: string }) => {
    try {
      let assemblies;

      if (input.taxonomy_id) {
        assemblies = await dataStore.getAssembliesByTaxonomyId(
          input.taxonomy_id
        );
      } else {
        assemblies = await dataStore.getAssemblies();
      }

      const limit = input.limit || assemblies.length;
      const offset = input.offset || 0;

      const paginatedAssemblies = assemblies
        .slice(offset, offset + limit)
        .map((assembly) => ({
          accession: assembly.accession,
          gcPercent: assembly.gcPercent,
          isRef: assembly.isRef,
          length: assembly.length,
          strainName: assembly.strainName,
          taxonomyId: assembly.ncbiTaxonomyId,
        }));

      return {
        assemblies: paginatedAssemblies,
        total: assemblies.length,
      };
    } catch (error) {
      logger.error("Error in getAssemblies:", error);
      throw error;
    }
  }
);

// Tool: Get BRC Assembly Details
export const getAssemblyDetails = ai.defineTool(
  {
    description:
      "Get detailed information about a specific assembly by accession from the BRC Analytics catalog",
    inputSchema: z.object({
      accession: z.string().describe("Accession ID of the assembly"),
    }),
    name: "brc_get_assembly_details",
    outputSchema: z.object({
      assembly: z
        .object({
          accession: z.string(),
          coverage: z.string(),
          gcPercent: z.number().nullable(),
          geneModelUrl: z.string().nullable(),
          isRef: z.string(),
          length: z.number(),
          level: z.string(),
          scaffoldCount: z.number(),
          scaffoldL50: z.number(),
          scaffoldN50: z.number(),
          strainName: z.string().nullable(),
          taxonomyId: z.string(),
        })
        .nullable(),
      error: z.string().optional(),
    }),
  },
  async (input: { accession: string }) => {
    try {
      const assembly = await dataStore.getAssemblyByAccession(input.accession);

      if (!assembly) {
        return {
          assembly: null,
          error: `Assembly with accession ${input.accession} not found`,
        };
      }

      return {
        assembly: {
          accession: assembly.accession,
          coverage: assembly.coverage,
          gcPercent: assembly.gcPercent,
          geneModelUrl: assembly.geneModelUrl,
          isRef: assembly.isRef,
          length: assembly.length,
          level: assembly.level,
          scaffoldCount: assembly.scaffoldCount,
          scaffoldL50: assembly.scaffoldL50,
          scaffoldN50: assembly.scaffoldN50,
          strainName: assembly.strainName,
          taxonomyId: assembly.ncbiTaxonomyId,
        },
      };
    } catch (error) {
      logger.error("Error in getAssemblyDetails:", error);
      return {
        assembly: null,
        error: `Error retrieving assembly: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
);

// Tool: Get BRC Workflows
export const getWorkflows = ai.defineTool(
  {
    description: "Get a list of all workflows in the BRC Analytics catalog",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .describe("Optional limit on the number of workflows to return"),
      offset: z.number().optional().describe("Optional offset for pagination"),
      tag: z.string().optional().describe("Optional tag to filter workflows"),
    }),
    name: "brc_get_workflows",
    outputSchema: z.object({
      total: z.number(),
      workflows: z.array(
        z.object({
          description: z.string(),
          id: z.string(),
          name: z.string(),
          tags: z.array(z.string()),
          version: z.string(),
        })
      ),
    }),
  },
  async (input: { limit?: number; offset?: number; tag?: string }) => {
    try {
      let workflows;

      if (input.tag) {
        workflows = await dataStore.getWorkflowsByTag(input.tag);
      } else {
        workflows = await dataStore.getWorkflows();
      }

      const limit = input.limit || workflows.length;
      const offset = input.offset || 0;

      const paginatedWorkflows = workflows
        .slice(offset, offset + limit)
        .map((workflow, index) => ({
          description: workflow.description || "",
          id: workflow.id || `workflow-${index + 1}`,
          name: workflow.name || "Unnamed Workflow",
          tags: Array.isArray(workflow.tags) ? workflow.tags : [],
          version: workflow.version || "1.0.0",
        }));

      return {
        total: workflows.length,
        workflows: paginatedWorkflows,
      };
    } catch (error) {
      logger.error("Error in getWorkflows:", error);
      throw error;
    }
  }
);

// Tool: Get BRC Workflow Details
export const getWorkflowDetails = ai.defineTool(
  {
    description:
      "Get detailed information about a specific workflow by ID from the BRC Analytics catalog",
    inputSchema: z.object({
      workflow_id: z.string().describe("ID of the workflow"),
    }),
    name: "brc_get_workflow_details",
    outputSchema: z.object({
      error: z.string().optional(),
      workflow: z
        .object({
          description: z.string(),
          id: z.string(),
          name: z.string(),
          parameters: z.array(
            z.object({
              description: z.string().optional(),
              id: z.string(),
              name: z.string(),
              required: z.boolean(),
              type: z.string(),
            })
          ),
          steps: z.array(
            z.object({
              description: z.string().optional(),
              id: z.string(),
              name: z.string(),
              tool_id: z.string(),
            })
          ),
          tags: z.array(z.string()),
          version: z.string(),
        })
        .nullable(),
    }),
  },
  async (input: { workflow_id: string }) => {
    try {
      const workflow = await dataStore.getWorkflowById(input.workflow_id);

      if (!workflow) {
        return {
          error: `Workflow with ID ${input.workflow_id} not found`,
          workflow: null,
        };
      }

      return {
        workflow: {
          description: workflow.description,
          id: workflow.id,
          name: workflow.name,
          parameters: workflow.parameters.map((param) => ({
            description: param.description,
            id: param.id,
            name: param.name,
            required: param.required,
            type: param.type,
          })),
          steps: workflow.steps.map((step) => ({
            description: step.description,
            id: step.id,
            name: step.name,
            tool_id: step.tool_id,
          })),
          tags: workflow.tags,
          version: workflow.version,
        },
      };
    } catch (error) {
      logger.error("Error in getWorkflowDetails:", error);
      return {
        error: `Error retrieving workflow: ${error instanceof Error ? error.message : String(error)}`,
        workflow: null,
      };
    }
  }
);

// Tool: Get BRC Outbreaks
export const getOutbreaks = ai.defineTool(
  {
    description: "Get a list of all outbreaks in the BRC Analytics catalog",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .describe("Optional limit on the number of outbreaks to return"),
      offset: z.number().optional().describe("Optional offset for pagination"),
    }),
    name: "brc_get_outbreaks",
    outputSchema: z.object({
      outbreaks: z.array(
        z.object({
          description: z.string(),
          id: z.string(),
          name: z.string(),
          priority: z.string(),
          taxonomyId: z.string(),
        })
      ),
      total: z.number(),
    }),
  },
  async (input: { limit?: number; offset?: number }) => {
    try {
      const outbreaks = await dataStore.getOutbreaks();
      const limit = input.limit || outbreaks.length;
      const offset = input.offset || 0;

      const paginatedOutbreaks = outbreaks
        .slice(offset, offset + limit)
        .map((outbreak) => ({
          description: outbreak.description,
          id: outbreak.id,
          name: outbreak.name,
          priority: outbreak.priority,
          taxonomyId: outbreak.taxonomyId,
        }));

      return {
        outbreaks: paginatedOutbreaks,
        total: outbreaks.length,
      };
    } catch (error) {
      logger.error("Error in getOutbreaks:", error);
      throw error;
    }
  }
);

// Tool: Get BRC Outbreak Details
export const getOutbreakDetails = ai.defineTool(
  {
    description:
      "Get detailed information about a specific outbreak by ID from the BRC Analytics catalog",
    inputSchema: z.object({
      outbreak_id: z.string().describe("ID of the outbreak"),
    }),
    name: "brc_get_outbreak_details",
    outputSchema: z.object({
      error: z.string().optional(),
      outbreak: z
        .object({
          description: z.string(),
          id: z.string(),
          name: z.string(),
          priority: z.string(),
          resources: z.array(
            z.object({
              title: z.string(),
              type: z.string(),
              url: z.string(),
            })
          ),
          taxonomyId: z.string(),
        })
        .nullable(),
    }),
  },
  async (input: { outbreak_id: string }) => {
    try {
      const outbreak = await dataStore.getOutbreakById(input.outbreak_id);

      if (!outbreak) {
        return {
          error: `Outbreak with ID ${input.outbreak_id} not found`,
          outbreak: null,
        };
      }

      return {
        outbreak: {
          description: outbreak.description,
          id: outbreak.id,
          name: outbreak.name,
          priority: outbreak.priority,
          resources: outbreak.resources,
          taxonomyId: outbreak.taxonomyId,
        },
      };
    } catch (error) {
      logger.error("Error in getOutbreakDetails:", error);
      return {
        error: `Error retrieving outbreak: ${error instanceof Error ? error.message : String(error)}`,
        outbreak: null,
      };
    }
  }
);

// Group all BRC Analytics tools
const brcTools = [
  getOrganisms,
  getOrganismDetails,
  getAssemblies,
  getAssemblyDetails,
  getWorkflows,
  getWorkflowDetails,
  getOutbreaks,
  getOutbreakDetails,
];

// Combine all tools into a single array for the chat flow
const allTools = [
  ...brcTools,
  ...galaxyTools, // Galaxy tools imported from galaxyTools.ts
  ...ncbiTools, // NCBI Datasets API tools
];

// Main chat flow
export const chatFlow = ai.defineFlow(
  {
    inputSchema: z.object({
      message: z.string().describe("User message"),
      session_id: SessionIdSchema.optional().describe(
        "Optional session ID for chat history"
      ),
    }),
    name: "chatFlow",
    outputSchema: z.string().describe("Assistant response"),
  },
  async (input: { message: string; session_id?: string }) => {
    // Generate or use the provided session ID
    const sessionId = input.session_id || `session_${Date.now()}`;

    // Get or create the session
    let session = await sessionStore.get(sessionId);
    if (!session) {
      session = await sessionStore.create(sessionId);
    }

    // Add the user message to the conversation history
    session.messages.push({ content: input.message, role: "user" });

    // Save the updated session
    await sessionStore.save(sessionId, session);

    // Prepare the prompt with conversation history
    const conversationHistory = session.messages
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n\n");

    const prompt = `You are BioBuddy, a BRC Analytics assistant and helpful AI that can provide information about organisms, assemblies, workflows, and outbreaks in the BRC Analytics catalog. You can also interact with the Galaxy bioinformatics platform and NCBI Datasets API to perform various tasks, including:

# BRC Analytics Catalog
- Get information about organisms in the BRC catalog
- Search for specific organisms by taxonomy ID
- Get details about genome assemblies
- Find workflows related to specific organisms or analyses
- Access outbreak information and related data

# Galaxy Platform
- Get Galaxy server information
- Search and retrieve workflows from the Interoperable Workflow Catalog (IWC)
- Import workflows from IWC into Galaxy
- List and manage Galaxy histories
- Create new Galaxy histories
- Search for Galaxy tools by name
- Run Galaxy tools with appropriate parameters
- Upload files to Galaxy for analysis

# NCBI Datasets API
- Search for genomic data across NCBI databases
- Retrieve genome assemblies and annotations
- Access taxonomic information
- Download sequence data for specific organisms

Conversation history:
${conversationHistory}

Based on this conversation, please provide a helpful response to the user's latest message. Use the available tools to retrieve information from the BRC Analytics catalog or interact with Galaxy as needed.`;

    // Generate response with tools
    const llmResponse = await ai.generate({
      prompt,
      tools: allTools,
    });

    const responseText = llmResponse.text;

    // Add the assistant response to the conversation history
    session.messages.push({ content: responseText, role: "assistant" });

    // Save the updated session
    await sessionStore.save(sessionId, session);

    // Return the response text
    return responseText;
  }
);

// Export the chat flow
export default chatFlow;
