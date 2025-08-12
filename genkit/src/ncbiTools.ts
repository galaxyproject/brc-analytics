import { z } from "genkit";
import { logger } from "@genkit-ai/core/logging";
import { ncbiClient } from "./ncbiClient";
import { ai } from "./ai";

/**
 * Tool to get genome annotation report by accession
 */
export const getGenomeAnnotationReportTool = ai.defineTool(
  {
    description:
      "Get genome annotation report for a specific genome assembly accession",
    inputSchema: z.object({
      accession: z
        .string()
        .describe("Genome assembly accession (e.g., GCF_000001405.40)"),
    }),
    name: "getGenomeAnnotationReport",
    outputSchema: z.any().describe("Genome annotation report data"),
  },
  async (input: { accession: string }) => {
    try {
      logger.info(
        `Getting genome annotation report for accession: ${input.accession}`
      );
      const result = await ncbiClient.getGenomeAnnotationReport(
        input.accession
      );
      return result;
    } catch (error) {
      logger.error(`Error getting genome annotation report: ${error}`);
      throw new Error(
        `Failed to get genome annotation report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get genome dataset report by accessions
 */
export const getGenomeDatasetReportTool = ai.defineTool(
  {
    description:
      "Get genome dataset report for specific genome assembly accessions",
    inputSchema: z.object({
      accessions: z
        .array(z.string())
        .describe(
          'Array of genome assembly accessions (e.g., ["GCF_000001405.40", "GCF_000001635.27"])'
        ),
    }),
    name: "getGenomeDatasetReport",
    outputSchema: z.any().describe("Genome dataset report data"),
  },
  async (input: { accessions: string[] }) => {
    try {
      logger.info(
        `Getting genome dataset report for accessions: ${input.accessions.join(", ")}`
      );
      const result = await ncbiClient.getGenomeDatasetReport(input.accessions);
      return result;
    } catch (error) {
      logger.error(`Error getting genome dataset report: ${error}`);
      throw new Error(
        `Failed to get genome dataset report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get genome sequence reports by accession
 */
export const getGenomeSequenceReportsTool = ai.defineTool(
  {
    description:
      "Get genome sequence reports for a specific genome assembly accession",
    inputSchema: z.object({
      accession: z
        .string()
        .describe("Genome assembly accession (e.g., GCF_000001405.40)"),
    }),
    name: "getGenomeSequenceReports",
    outputSchema: z.any().describe("Genome sequence reports data"),
  },
  async (input: { accession: string }) => {
    try {
      logger.info(
        `Getting genome sequence reports for accession: ${input.accession}`
      );
      const result = await ncbiClient.getGenomeSequenceReports(input.accession);
      return result;
    } catch (error) {
      logger.error(`Error getting genome sequence reports: ${error}`);
      throw new Error(
        `Failed to get genome sequence reports: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get genome dataset report by assembly names
 */
export const getGenomeByAssemblyNameDatasetReportTool = ai.defineTool(
  {
    description: "Get genome dataset report for specific assembly names",
    inputSchema: z.object({
      assemblyNames: z
        .array(z.string())
        .describe('Array of assembly names (e.g., ["GRCh38.p14", "GRCm39"])'),
    }),
    name: "getGenomeByAssemblyNameDatasetReport",
    outputSchema: z.any().describe("Genome dataset report data"),
  },
  async (input: { assemblyNames: string[] }) => {
    try {
      logger.info(
        `Getting genome dataset report for assembly names: ${input.assemblyNames.join(", ")}`
      );
      const result = await ncbiClient.getGenomeByAssemblyNameDatasetReport(
        input.assemblyNames
      );
      return result;
    } catch (error) {
      logger.error(
        `Error getting genome dataset report by assembly names: ${error}`
      );
      throw new Error(
        `Failed to get genome dataset report by assembly names: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get genome dataset report by BioProject IDs
 */
export const getGenomeByBioprojectDatasetReportTool = ai.defineTool(
  {
    description: "Get genome dataset report for specific BioProject IDs",
    inputSchema: z.object({
      bioprojects: z
        .array(z.string())
        .describe('Array of BioProject IDs (e.g., ["PRJNA164", "PRJNA31257"])'),
    }),
    name: "getGenomeByBioprojectDatasetReport",
    outputSchema: z.any().describe("Genome dataset report data"),
  },
  async (input: { bioprojects: string[] }) => {
    try {
      logger.info(
        `Getting genome dataset report for bioprojects: ${input.bioprojects.join(", ")}`
      );
      const result = await ncbiClient.getGenomeByBioprojectDatasetReport(
        input.bioprojects
      );
      return result;
    } catch (error) {
      logger.error(
        `Error getting genome dataset report by bioprojects: ${error}`
      );
      throw new Error(
        `Failed to get genome dataset report by bioprojects: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get genome dataset report by BioSample IDs
 */
export const getGenomeByBiosampleDatasetReportTool = ai.defineTool(
  {
    description: "Get genome dataset report for specific BioSample IDs",
    inputSchema: z.object({
      biosampleIds: z
        .array(z.string())
        .describe(
          'Array of BioSample IDs (e.g., ["SAMN02981385", "SAMN00000001"])'
        ),
    }),
    name: "getGenomeByBiosampleDatasetReport",
    outputSchema: z.any().describe("Genome dataset report data"),
  },
  async (input: { biosampleIds: string[] }) => {
    try {
      logger.info(
        `Getting genome dataset report for biosamples: ${input.biosampleIds.join(", ")}`
      );
      const result = await ncbiClient.getGenomeByBiosampleDatasetReport(
        input.biosampleIds
      );
      return result;
    } catch (error) {
      logger.error(
        `Error getting genome dataset report by biosamples: ${error}`
      );
      throw new Error(
        `Failed to get genome dataset report by biosamples: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get genome dataset report by taxonomy IDs
 */
export const getGenomeByTaxonDatasetReportTool = ai.defineTool(
  {
    description: "Get genome dataset report for specific taxonomy IDs",
    inputSchema: z.object({
      taxons: z
        .array(z.string())
        .describe('Array of taxonomy IDs (e.g., ["9606", "10090"])'),
    }),
    name: "getGenomeByTaxonDatasetReport",
    outputSchema: z.any().describe("Genome dataset report data"),
  },
  async (input: { taxons: string[] }) => {
    try {
      logger.info(
        `Getting genome dataset report for taxons: ${input.taxons.join(", ")}`
      );
      const result = await ncbiClient.getGenomeByTaxonDatasetReport(
        input.taxons
      );
      return result;
    } catch (error) {
      logger.error(`Error getting genome dataset report by taxons: ${error}`);
      throw new Error(
        `Failed to get genome dataset report by taxons: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get gene data by accessions
 */
export const getGeneByAccessionTool = ai.defineTool(
  {
    description: "Get gene data for specific gene accessions",
    inputSchema: z.object({
      accessions: z
        .array(z.string())
        .describe(
          'Array of gene accessions (e.g., ["NM_000014.6", "NM_000015.4"])'
        ),
    }),
    name: "getGeneByAccession",
    outputSchema: z.any().describe("Gene data"),
  },
  async (input: { accessions: string[] }) => {
    try {
      logger.info(
        `Getting gene data for accessions: ${input.accessions.join(", ")}`
      );
      const result = await ncbiClient.getGeneByAccession(input.accessions);
      return result;
    } catch (error) {
      logger.error(`Error getting gene data by accessions: ${error}`);
      throw new Error(
        `Failed to get gene data by accessions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get gene orthologs by gene ID
 */
export const getGeneOrthologsTool = ai.defineTool(
  {
    description: "Get gene orthologs for a specific gene ID",
    inputSchema: z.object({
      geneId: z.string().describe('Gene ID (e.g., "5111")'),
    }),
    name: "getGeneOrthologs",
    outputSchema: z.any().describe("Gene ortholog data"),
  },
  async (input: { geneId: string }) => {
    try {
      logger.info(`Getting gene orthologs for gene ID: ${input.geneId}`);
      const result = await ncbiClient.getGeneOrthologs(input.geneId);
      return result;
    } catch (error) {
      logger.error(`Error getting gene orthologs: ${error}`);
      throw new Error(
        `Failed to get gene orthologs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get gene data by gene IDs
 */
export const getGeneByIdTool = ai.defineTool(
  {
    description: "Get gene data for specific gene IDs",
    inputSchema: z.object({
      geneIds: z
        .array(z.string())
        .describe('Array of gene IDs (e.g., ["5111", "672"])'),
    }),
    name: "getGeneById",
    outputSchema: z.any().describe("Gene data"),
  },
  async (input: { geneIds: string[] }) => {
    try {
      logger.info(
        `Getting gene data for gene IDs: ${input.geneIds.join(", ")}`
      );
      const result = await ncbiClient.getGeneById(input.geneIds);
      return result;
    } catch (error) {
      logger.error(`Error getting gene data by IDs: ${error}`);
      throw new Error(
        `Failed to get gene data by IDs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get gene links by gene IDs
 */
export const getGeneLinksTool = ai.defineTool(
  {
    description: "Get gene links for specific gene IDs",
    inputSchema: z.object({
      geneIds: z
        .array(z.string())
        .describe('Array of gene IDs (e.g., ["5111", "672"])'),
    }),
    name: "getGeneLinks",
    outputSchema: z.any().describe("Gene links data"),
  },
  async (input: { geneIds: string[] }) => {
    try {
      logger.info(
        `Getting gene links for gene IDs: ${input.geneIds.join(", ")}`
      );
      const result = await ncbiClient.getGeneLinks(input.geneIds);
      return result;
    } catch (error) {
      logger.error(`Error getting gene links: ${error}`);
      throw new Error(
        `Failed to get gene links: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get gene data by taxonomy ID
 */
export const getGeneByTaxonTool = ai.defineTool(
  {
    description: "Get gene data for a specific taxonomy ID",
    inputSchema: z.object({
      taxon: z.string().describe('Taxonomy ID (e.g., "9606")'),
    }),
    name: "getGeneByTaxon",
    outputSchema: z.any().describe("Gene data"),
  },
  async (input: { taxon: string }) => {
    try {
      logger.info(`Getting gene data for taxon: ${input.taxon}`);
      const result = await ncbiClient.getGeneByTaxon(input.taxon);
      return result;
    } catch (error) {
      logger.error(`Error getting gene data by taxon: ${error}`);
      throw new Error(
        `Failed to get gene data by taxon: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get gene chromosome summary by taxonomy ID and annotation name
 */
export const getGeneChromosomeSummaryTool = ai.defineTool(
  {
    description:
      "Get gene chromosome summary for a specific taxonomy ID and annotation name",
    inputSchema: z.object({
      annotationName: z.string().describe('Annotation name (e.g., "RefSeq")'),
      taxon: z.string().describe('Taxonomy ID (e.g., "9606")'),
    }),
    name: "getGeneChromosomeSummary",
    outputSchema: z.any().describe("Chromosome summary data"),
  },
  async (input: { annotationName: string; taxon: string }) => {
    try {
      logger.info(
        `Getting gene chromosome summary for taxon: ${input.taxon}, annotation: ${input.annotationName}`
      );
      const result = await ncbiClient.getGeneChromosomeSummary(
        input.taxon,
        input.annotationName
      );
      return result;
    } catch (error) {
      logger.error(`Error getting gene chromosome summary: ${error}`);
      throw new Error(
        `Failed to get gene chromosome summary: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get taxonomy dataset report by taxonomy IDs
 */
export const getTaxonomyDatasetReportTool = ai.defineTool(
  {
    description: "Get taxonomy dataset report for specific taxonomy IDs",
    inputSchema: z.object({
      taxons: z
        .array(z.string())
        .describe('Array of taxonomy IDs (e.g., ["9606", "10090"])'),
    }),
    name: "getTaxonomyDatasetReport",
    outputSchema: z.any().describe("Taxonomy dataset report data"),
  },
  async (input: { taxons: string[] }) => {
    try {
      logger.info(
        `Getting taxonomy dataset report for taxons: ${input.taxons.join(", ")}`
      );
      const result = await ncbiClient.getTaxonomyDatasetReport(input.taxons);
      return result;
    } catch (error) {
      logger.error(`Error getting taxonomy dataset report: ${error}`);
      throw new Error(
        `Failed to get taxonomy dataset report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get taxonomy name report by taxonomy IDs
 */
export const getTaxonomyNameReportTool = ai.defineTool(
  {
    description: "Get taxonomy name report for specific taxonomy IDs",
    inputSchema: z.object({
      taxons: z
        .array(z.string())
        .describe('Array of taxonomy IDs (e.g., ["9606", "10090"])'),
    }),
    name: "getTaxonomyNameReport",
    outputSchema: z.any().describe("Taxonomy name report data"),
  },
  async (input: { taxons: string[] }) => {
    try {
      logger.info(
        `Getting taxonomy name report for taxons: ${input.taxons.join(", ")}`
      );
      const result = await ncbiClient.getTaxonomyNameReport(input.taxons);
      return result;
    } catch (error) {
      logger.error(`Error getting taxonomy name report: ${error}`);
      throw new Error(
        `Failed to get taxonomy name report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get BioSample report by accessions
 */
export const getBiosampleReportTool = ai.defineTool(
  {
    description: "Get BioSample report for specific BioSample accessions",
    inputSchema: z.object({
      accessions: z
        .array(z.string())
        .describe(
          'Array of BioSample accessions (e.g., ["SAMN02981385", "SAMN00000001"])'
        ),
    }),
    name: "getBiosampleReport",
    outputSchema: z.any().describe("BioSample report data"),
  },
  async (input: { accessions: string[] }) => {
    try {
      logger.info(
        `Getting BioSample report for accessions: ${input.accessions.join(", ")}`
      );
      const result = await ncbiClient.getBiosampleReport(input.accessions);
      return result;
    } catch (error) {
      logger.error(`Error getting BioSample report: ${error}`);
      throw new Error(
        `Failed to get BioSample report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

/**
 * Tool to get organelle dataset report by accessions
 */
export const getOrganelleDatasetReportTool = ai.defineTool(
  {
    description:
      "Get organelle dataset report for specific organelle accessions",
    inputSchema: z.object({
      accessions: z.array(z.string()).describe("Array of organelle accessions"),
    }),
    name: "getOrganelleDatasetReport",
    outputSchema: z.any().describe("Organelle dataset report data"),
  },
  async (input: { accessions: string[] }) => {
    try {
      logger.info(
        `Getting organelle dataset report for accessions: ${input.accessions.join(", ")}`
      );
      const result = await ncbiClient.getOrganelleDatasetReport(
        input.accessions
      );
      return result;
    } catch (error) {
      logger.error(`Error getting organelle dataset report: ${error}`);
      throw new Error(
        `Failed to get organelle dataset report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
);

// Export all NCBI tools as an array
export const ncbiTools = [
  getGenomeAnnotationReportTool,
  getGenomeDatasetReportTool,
  getGenomeSequenceReportsTool,
  getGenomeByAssemblyNameDatasetReportTool,
  getGenomeByBioprojectDatasetReportTool,
  getGenomeByBiosampleDatasetReportTool,
  getGenomeByTaxonDatasetReportTool,
  getGeneByAccessionTool,
  getGeneOrthologsTool,
  getGeneByIdTool,
  getGeneLinksTool,
  getGeneByTaxonTool,
  getGeneChromosomeSummaryTool,
  getTaxonomyDatasetReportTool,
  getTaxonomyNameReportTool,
  getBiosampleReportTool,
  getOrganelleDatasetReportTool,
];
