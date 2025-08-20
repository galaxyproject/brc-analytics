import fs from "fs";
import path from "path";
import { Organism, Assembly, Workflow, Outbreak } from "./types";

/**
 * DataStore class for accessing BRC Analytics catalog data
 *
 * @class
 * @property {string} basePath - The base path for the catalog data
 * @property {Organism[]} organisms - The organisms data
 * @property {Assembly[]} assemblies - The assemblies data
 * @property {Workflow[]} workflows - The workflows data
 * @property {Outbreak[]} outbreaks - The outbreaks data
 *
 * @returns {DataStore} A new DataStore instance
 */
export class DataStore {
  private basePath: string;
  private organisms: Organism[] | null = null;
  private assemblies: Assembly[] | null = null;
  private workflows: Workflow[] | null = null;
  private outbreaks: Outbreak[] | null = null;

  constructor(basePath: string) {
    this.basePath = basePath;
    // Ensure the directory exists
    if (!fs.existsSync(basePath)) {
      throw new Error(`Catalog output directory not found: ${basePath}`);
    }
  }

  /**
   * Get all organisms
   *
   * @returns {Promise<Organism[]>} A promise that resolves to an array of organisms
   */
  async getOrganisms(): Promise<Organism[]> {
    if (!this.organisms) {
      try {
        const filePath = path.join(this.basePath, "organisms.json");
        const data = fs.readFileSync(filePath, "utf8");
        this.organisms = JSON.parse(data) as Organism[];
      } catch (error) {
        console.error("Error loading organisms:", error);
        throw new Error("Failed to load organisms data");
      }
    }
    return this.organisms;
  }

  /**
   * Get organism by taxonomy ID
   *
   * @param {string} taxonomyId - The taxonomy ID of the organism
   *
   * @returns {Promise<Organism | null>} A promise that resolves to an organism or null
   */
  async getOrganismByTaxonomyId(taxonomyId: string): Promise<Organism | null> {
    const organisms = await this.getOrganisms();
    return (
      organisms.find(
        (org) =>
          org.assemblyTaxonomyIds &&
          Array.isArray(org.assemblyTaxonomyIds) &&
          org.assemblyTaxonomyIds.includes(taxonomyId)
      ) || null
    );
  }

  /**
   * Get all assemblies
   *
   * @returns {Promise<Assembly[]>} A promise that resolves to an array of assemblies
   */
  async getAssemblies(): Promise<Assembly[]> {
    if (!this.assemblies) {
      try {
        const filePath = path.join(this.basePath, "assemblies.json");
        const data = fs.readFileSync(filePath, "utf8");
        this.assemblies = JSON.parse(data) as Assembly[];
      } catch (error) {
        console.error("Error loading assemblies:", error);
        throw new Error("Failed to load assemblies data");
      }
    }
    return this.assemblies;
  }

  /**
   * Get assembly by accession
   *
   * @param {string} accession - The accession of the assembly
   *
   * @returns {Promise<Assembly | null>} A promise that resolves to an assembly or null
   */
  async getAssemblyByAccession(accession: string): Promise<Assembly | null> {
    const assemblies = await this.getAssemblies();
    return (
      assemblies.find((assembly) => assembly.accession === accession) || null
    );
  }

  /**
   * Get assemblies by taxonomy ID
   *
   * @param {string} taxonomyId - The taxonomy ID of the assemblies
   *
   * @returns {Promise<Assembly[]>} A promise that resolves to an array of assemblies
   */
  async getAssembliesByTaxonomyId(taxonomyId: string): Promise<Assembly[]> {
    const assemblies = await this.getAssemblies();
    return assemblies.filter(
      (assembly) =>
        assembly.ncbiTaxonomyId === taxonomyId ||
        (assembly.lineageTaxonomyIds &&
          Array.isArray(assembly.lineageTaxonomyIds) &&
          assembly.lineageTaxonomyIds.includes(taxonomyId))
    );
  }

  /**
   * Get all workflows
   *
   * @returns {Promise<Workflow[]>} A promise that resolves to an array of workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    if (!this.workflows) {
      try {
        const filePath = path.join(this.basePath, "workflows.json");
        const data = fs.readFileSync(filePath, "utf8");
        const categories = JSON.parse(data) as Array<{
          category: string;
          description: string;
          name: string;
          workflows?: Array<{
            iwcId?: string;
            parameters?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any -- what would marius do
            workflowDescription?: string;
            workflowName?: string;
          }>;
        }>;

        // Transform the categories into individual workflows with proper structure
        this.workflows = [];

        categories.forEach((category, categoryIndex) => {
          // Create a workflow for the category itself
          const categoryWorkflow: Workflow = {
            description: category.description || "",
            id: `category-${categoryIndex + 1}`,
            name: category.name || "Unnamed Category",
            parameters: [],
            steps: [],
            tags: [
              category.category
                ? category.category.toLowerCase()
                : "uncategorized",
            ],
            version: "1.0.0",
          };

          if (this.workflows) {
            // Check if this.workflows is not null
            this.workflows.push(categoryWorkflow);
          }

          // Add individual workflows from this category if they exist
          if (Array.isArray(category.workflows)) {
            category.workflows.forEach((workflow, workflowIndex) => {
              if (this.workflows) {
                // Check if this.workflows is not null
                this.workflows.push({
                  description: workflow.workflowDescription || "",
                  id:
                    workflow.iwcId ||
                    `workflow-${categoryIndex + 1}-${workflowIndex + 1}`,
                  name: workflow.workflowName || "Unnamed Workflow",
                  parameters: workflow.parameters || [],
                  steps: [],
                  tags: [
                    category.category
                      ? category.category.toLowerCase()
                      : "uncategorized",
                  ],
                  version: "1.0.0",
                });
              }
            });
          }
        });
      } catch (error) {
        console.error("Error loading workflows:", error);
        throw new Error("Failed to load workflows data");
      }
    }
    return this.workflows;
  }

  /**
   * Get workflow by ID
   *
   * @param {string} id - The ID of the workflow
   *
   * @returns {Promise<Workflow | null>} A promise that resolves to a workflow or null
   */
  async getWorkflowById(id: string): Promise<Workflow | null> {
    const workflows = await this.getWorkflows();
    return workflows.find((workflow) => workflow.id === id) || null;
  }

  /**
   * Get workflows by tag
   *
   * @param {string} tag - The tag of the workflows
   *
   * @returns {Promise<Workflow[]>} A promise that resolves to an array of workflows
   */
  async getWorkflowsByTag(tag: string): Promise<Workflow[]> {
    const workflows = await this.getWorkflows();
    return workflows.filter(
      (workflow) =>
        workflow.tags &&
        Array.isArray(workflow.tags) &&
        workflow.tags.includes(tag)
    );
  }

  /**
   * Get all outbreaks
   *
   * @returns {Promise<Outbreak[]>} A promise that resolves to an array of outbreaks
   */
  async getOutbreaks(): Promise<Outbreak[]> {
    if (!this.outbreaks) {
      try {
        const filePath = path.join(this.basePath, "outbreaks.json");
        const data = fs.readFileSync(filePath, "utf8");
        this.outbreaks = JSON.parse(data) as Outbreak[];
      } catch (error) {
        console.error("Error loading outbreaks:", error);
        throw new Error("Failed to load outbreaks data");
      }
    }
    return this.outbreaks;
  }

  /**
   * Get outbreak by ID
   *
   * @param {string} id - The ID of the outbreak
   *
   * @returns {Promise<Outbreak | null>} A promise that resolves to an outbreak or null
   */
  async getOutbreakById(id: string): Promise<Outbreak | null> {
    const outbreaks = await this.getOutbreaks();
    return outbreaks.find((outbreak) => outbreak.id === id) || null;
  }

  /**
   * Get outbreak by taxonomy ID
   *
   * @param {string} taxonomyId - The taxonomy ID of the outbreak
   *
   * @returns {Promise<Outbreak | null>} A promise that resolves to an outbreak or null
   */
  async getOutbreakByTaxonomyId(taxonomyId: string): Promise<Outbreak | null> {
    const outbreaks = await this.getOutbreaks();
    return (
      outbreaks.find((outbreak) => outbreak.taxonomyId === taxonomyId) || null
    );
  }
}

// Create a singleton instance
export const dataStore = new DataStore(
  process.env.CATALOG_OUTPUT_PATH || "../catalog/output"
);
