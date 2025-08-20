import axios from "axios";
import { logger } from "@genkit-ai/core/logging";

// Base URL for NCBI Datasets API v2
const NCBI_API_BASE_URL = "https://api.ncbi.nlm.nih.gov/datasets/v2";

/**
 * Client for interacting with the NCBI Datasets API
 */
export class NcbiDatasetsClient {
  private apiKey?: string;
  private baseUrl: string;

  /**
   * Create a new NCBI Datasets API client
   * @param apiKey - Optional API key for higher rate limits
   * @param baseUrl - Optional custom base URL
   */
  constructor(apiKey?: string, baseUrl: string = NCBI_API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Make a request to the NCBI Datasets API
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters
   * @returns Response data
   */
  async request<T>(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      // Add API key if available
      if (this.apiKey) {
        headers["api-key"] = this.apiKey;
      }

      logger.debug(`Making request to NCBI API: ${url}`);

      const response = await axios.get(url, {
        headers,
        params,
      });

      return response.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.message || error.message;

        logger.error(`NCBI API error (${statusCode}): ${errorMessage}`);
        throw new Error(`NCBI API error (${statusCode}): ${errorMessage}`);
      }

      logger.error("Error making NCBI API request:", error);
      throw new Error(
        `Error making NCBI API request: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get genome annotation report by accession
   * @param accession - Genome assembly accession
   * @returns Annotation report data
   */
  async getGenomeAnnotationReport(accession: string): Promise<unknown> {
    return this.request(`/genome/accession/${accession}/annotation_report`);
  }

  /**
   * Get genome dataset report by accessions
   * @param accessions - Array of genome assembly accessions
   * @returns Dataset report data
   */
  async getGenomeDatasetReport(accessions: string[]): Promise<unknown> {
    return this.request(
      `/genome/accession/${accessions.join(",")}/dataset_report`
    );
  }

  /**
   * Get genome sequence reports by accession
   * @param accession - Genome assembly accession
   * @returns Sequence reports data
   */
  async getGenomeSequenceReports(accession: string): Promise<unknown> {
    return this.request(`/genome/accession/${accession}/sequence_reports`);
  }

  /**
   * Get genome dataset report by assembly names
   * @param assemblyNames - Array of assembly names
   * @returns Dataset report data
   */
  async getGenomeByAssemblyNameDatasetReport(
    assemblyNames: string[]
  ): Promise<unknown> {
    return this.request(
      `/genome/assembly_name/${assemblyNames.join(",")}/dataset_report`
    );
  }

  /**
   * Get genome dataset report by BioProject IDs
   * @param bioprojects - Array of BioProject IDs
   * @returns Dataset report data
   */
  async getGenomeByBioprojectDatasetReport(
    bioprojects: string[]
  ): Promise<unknown> {
    return this.request(
      `/genome/bioproject/${bioprojects.join(",")}/dataset_report`
    );
  }

  /**
   * Get genome dataset report by BioSample IDs
   * @param biosampleIds - Array of BioSample IDs
   * @returns Dataset report data
   */
  async getGenomeByBiosampleDatasetReport(
    biosampleIds: string[]
  ): Promise<unknown> {
    return this.request(
      `/genome/biosample/${biosampleIds.join(",")}/dataset_report`
    );
  }

  /**
   * Get genome dataset report by taxonomy IDs
   * @param taxons - Array of taxonomy IDs
   * @returns Dataset report data
   */
  async getGenomeByTaxonDatasetReport(taxons: string[]): Promise<unknown> {
    return this.request(`/genome/taxon/${taxons.join(",")}/dataset_report`);
  }

  /**
   * Get gene data by accessions
   * @param accessions - Array of gene accessions
   * @returns Gene data
   */
  async getGeneByAccession(accessions: string[]): Promise<unknown> {
    return this.request(`/gene/accession/${accessions.join(",")}`);
  }

  /**
   * Get gene orthologs by gene ID
   * @param geneId - Gene ID
   * @returns Ortholog data
   */
  async getGeneOrthologs(geneId: string): Promise<unknown> {
    return this.request(`/gene/id/${geneId}/orthologs`);
  }

  /**
   * Get gene data by gene IDs
   * @param geneIds - Array of gene IDs
   * @returns Gene data
   */
  async getGeneById(geneIds: string[]): Promise<unknown> {
    return this.request(`/gene/id/${geneIds.join(",")}`);
  }

  /**
   * Get gene links by gene IDs
   * @param geneIds - Array of gene IDs
   * @returns Gene links data
   */
  async getGeneLinks(geneIds: string[]): Promise<unknown> {
    return this.request(`/gene/id/${geneIds.join(",")}/links`);
  }

  /**
   * Get gene data by taxonomy ID
   * @param taxon - Taxonomy ID
   * @returns Gene data
   */
  async getGeneByTaxon(taxon: string): Promise<unknown> {
    return this.request(`/gene/taxon/${taxon}`);
  }

  /**
   * Get gene chromosome summary by taxonomy ID and annotation name
   * @param taxon - Taxonomy ID
   * @param annotationName - Annotation name
   * @returns Chromosome summary data
   */
  async getGeneChromosomeSummary(
    taxon: string,
    annotationName: string
  ): Promise<unknown> {
    return this.request(
      `/gene/taxon/${taxon}/annotation/${annotationName}/chromosome_summary`
    );
  }

  /**
   * Get taxonomy dataset report by taxonomy IDs
   * @param taxons - Array of taxonomy IDs
   * @returns Dataset report data
   */
  async getTaxonomyDatasetReport(taxons: string[]): Promise<unknown> {
    return this.request(`/taxonomy/taxon/${taxons.join(",")}/dataset_report`);
  }

  /**
   * Get taxonomy name report by taxonomy IDs
   * @param taxons - Array of taxonomy IDs
   * @returns Name report data
   */
  async getTaxonomyNameReport(taxons: string[]): Promise<unknown> {
    return this.request(`/taxonomy/taxon/${taxons.join(",")}/name_report`);
  }

  /**
   * Get BioSample report by accessions
   * @param accessions - Array of BioSample accessions
   * @returns BioSample report data
   */
  async getBiosampleReport(accessions: string[]): Promise<unknown> {
    return this.request(
      `/biosample/accession/${accessions.join(",")}/biosample_report`
    );
  }

  /**
   * Get organelle dataset report by accessions
   * @param accessions - Array of organelle accessions
   * @returns Dataset report data
   */
  async getOrganelleDatasetReport(accessions: string[]): Promise<unknown> {
    return this.request(
      `/organelle/accessions/${accessions.join(",")}/dataset_report`
    );
  }
}

// Create and export a singleton instance
export const ncbiClient = new NcbiDatasetsClient(process.env.NCBI_API_KEY);
