/**
* Possible ploidies of an organism.
*/
export enum OrganismPloidy {
    
    DIPLOID = "DIPLOID",
    HAPLOID = "HAPLOID",
    POLYPLOID = "POLYPLOID",
};
/**
* Possible priorities of an outbreak.
*/
export enum OutbreakPriority {
    
    HIGHEST = "HIGHEST",
    CRITICAL = "CRITICAL",
    HIGH = "HIGH",
    MODERATE_HIGH = "MODERATE_HIGH",
    MODERATE = "MODERATE",
};
/**
* Possible types of an outbreak resource.
*/
export enum OutbreakResourceType {
    
    PUBLICATION = "PUBLICATION",
    REFERENCE = "REFERENCE",
    NEWS = "NEWS",
    WORKFLOW = "WORKFLOW",
    DATA = "DATA",
    OTHER = "OTHER",
    HGPHYLOPLACE = "HGPHYLOPLACE",
};
/**
* Set of IDs of workflow categories.
*/
export enum WorkflowCategoryId {
    
    VARIANT_CALLING = "VARIANT_CALLING",
    TRANSCRIPTOMICS = "TRANSCRIPTOMICS",
    REGULATION = "REGULATION",
    ASSEMBLY = "ASSEMBLY",
    GENOME_COMPARISONS = "GENOME_COMPARISONS",
    PROTEIN_FOLDING = "PROTEIN_FOLDING",
    CONSENSUS_SEQUENCES = "CONSENSUS_SEQUENCES",
    OTHER = "OTHER",
};
/**
* Possible variables that can be inserted into workflow parameters.
*/
export enum WorkflowParameterVariable {
    
    ASSEMBLY_ID = "ASSEMBLY_ID",
    ASSEMBLY_FASTA_URL = "ASSEMBLY_FASTA_URL",
    GENE_MODEL_URL = "GENE_MODEL_URL",
    SANGER_READ_RUN_PAIRED = "SANGER_READ_RUN_PAIRED",
    SANGER_READ_RUN_SINGLE = "SANGER_READ_RUN_SINGLE",
};
/**
* Possible ploidies supported by workflows.
*/
export enum WorkflowPloidy {
    
    ANY = "ANY",
    DIPLOID = "DIPLOID",
    HAPLOID = "HAPLOID",
    POLYPLOID = "POLYPLOID",
};


/**
 * Root object containing a collection of genomic assembly definitions for the BRC Analytics platform.
 */
export interface Assemblies {
    /** Collection of genomic assembly entries that will be available for analysis in the BRC Analytics platform. */
    assemblies: Assembly[],
}


/**
 * Definition of a genomic assembly with its unique identifier.
 */
export interface Assembly {
    /** The unique accession identifier for the assembly (e.g., GCA_000001405.28 for GRCh38), used to retrieve the assembly data from public repositories. */
    accession: string,
}


/**
 * Root object containing a collection of organism definitions for the BRC Analytics platform.
 */
export interface Organisms {
    /** Collection of organism entries that will be available in the BRC Analytics platform. */
    organisms: Organism[],
}


/**
 * Definition of an organism with its taxonomic and genetic characteristics.
 */
export interface Organism {
    /** An NCBI Taxonomy ID at rank 'species'. */
    taxonomy_id: number,
    /** The possible ploidy states (number of chromosome sets) that the organism may have, which determines compatible workflows. */
    ploidy: OrganismPloidy[],
}


/**
 * Root object containing a collection of pathogen definitions for the BRC Analytics platform to highlight as outbreaks/priority pathogens.
 */
export interface Outbreaks {
    /** Collection of pathogen entries that will be displayed in the BRC Analytics platform as outbreaks/priority pathogens. */
    outbreaks: Outbreak[],
}


/**
 * Definition of a priority pathogen with its taxonomic classification, priority level, and associated resources.
 */
export interface Outbreak {
    /** The display name of the pathogen as it will appear in the BRC Analytics interface. */
    name: string,
    /** The NCBI Taxonomy ID for the pathogen. Used to link to relevant genomic data and workflows. */
    taxonomy_id: number,
    /** The priority level of the pathogen, which determines its visibility and prominence in the BRC Analytics interface. */
    priority: OutbreakPriority,
    /** Collection of external resources (references, tools, databases) related to the pathogen. */
    resources: OutbreakResource[],
    /** Reference to a markdown file containing detailed information about the pathogen. */
    description: MarkdownFileReference,
    /** Boolean flag that determines if the pathogen should be included in the BRC Analytics interface. Used to manage visibility as pathogen relevance changes over time. */
    active: boolean,
    /** List of NCBI Taxonomy IDs for descendant taxa (e.g., specific strains or serotypes) that should be highlighted within the outbreak category. */
    highlight_descendant_taxonomy_ids?: number[] | null,
}


/**
 * Definition of an external resource (reference, tool, database) associated with a priority pathogen.
 */
export interface OutbreakResource {
    /** The complete URL (including http/https protocol) to the external resource. */
    url: string,
    /** The display title for the resource link as it will appear in the BRC Analytics interface. */
    title: string,
    /** The category or type of the resource (e.g., REFERENCE, TOOL, DATABASE), which determines how it is displayed and organized. */
    type: OutbreakResourceType,
}


/**
 * A reference to a markdown file containing detailed content about a priority pathogen.
 */
export interface MarkdownFileReference {
    /** Relative path to the markdown file from the project root. Must end with .md extension. */
    path: string,
}


/**
 * Root object containing a collection of workflow category definitions used to organize workflows in the BRC Analytics platform.
 */
export interface WorkflowCategories {
    /** Collection of workflow category entries that will be used to group and organize workflows in the BRC Analytics interface. */
    workflow_categories: WorkflowCategory[],
}


/**
 * Definition of a workflow category used to group related workflows for organization and display purposes.
 */
export interface WorkflowCategory {
    /** The unique identifier for the workflow category, used to link workflows to their respective categories. */
    category: WorkflowCategoryId,
    /** The human-readable display name of the workflow category as it will appear in the BRC Analytics interface. */
    name: string,
    /** A detailed description of the workflow category explaining its purpose and the types of workflows it contains. */
    description: string,
    /** Boolean flag that determines whether to display a 'Coming Soon' indicator for this category in the BRC Analytics interface when workflows in this category are not yet available. */
    show_coming_soon: boolean,
}


/**
 * Placeholder type that allows for arbitrary data structures; used to avoid unnecessary restrictions on the `type_guide` slot in workflow parameters.
 */
export interface Any {
}


/**
 * Root object containing a collection of Galaxy workflow definitions for the BRC Analytics platform.
 */
export interface Workflows {
    /** Collection of workflow entries that will be available to users in the BRC Analytics platform. */
    workflows: Workflow[],
}


/**
 * Definition of a Galaxy workflow with its metadata, parameters, and organism compatibility information.
 */
export interface Workflow {
    /** The Tool Repository Service (TRS) identifier for the workflow, used to locate and retrieve the workflow from a Galaxy server. */
    trs_id: string,
    /** List of category identifiers that this workflow belongs to, determining how it is organized and displayed in the BRC Analytics interface. */
    categories: WorkflowCategoryId[],
    /** The human-readable display name of the workflow as it will appear in the BRC Analytics interface. */
    workflow_name: string,
    /** A detailed description of the workflow's purpose, functionality, and expected outputs for users. */
    workflow_description: string,
    /** The ploidy state (number of chromosome sets) that this workflow is designed to work with, ensuring compatibility with organism data. */
    ploidy: WorkflowPloidy,
    /** The NCBI Taxonomy ID of the organism this workflow is designed for. If specified, the workflow will be available for all assemblies with this ID in their taxonomic lineage. */
    taxonomy_id?: number | null,
    /** Collection of input parameters that will be passed to the workflow when it is executed, including data sources and configuration options. */
    parameters: WorkflowParameter[],
    /** Boolean flag that determines if the workflow should be included in the BRC Analytics interface. Used to manage visibility of workflows that may be under development or deprecated. */
    active: boolean,
    /** The Intergalactic Workflow Commission (IWC) identifier for the workflow, used to link to the workflow's page on the IWC website. */
    iwc_id: string,
}


/**
 * Definition of an input parameter for a Galaxy workflow, specifying how the parameter value should be determined when the workflow is executed.
 */
export interface WorkflowParameter {
    /** The identifier for the parameter as expected by the Galaxy workflow, used to map the parameter value to the correct input. */
    key: string,
    /** A predefined variable that will be substituted as the value of the parameter at runtime, such as assembly information. */
    variable?: WorkflowParameterVariable | null,
    /** A direct URL specification for the parameter, allowing for external data sources to be provided to the workflow. */
    url_spec?: WorkflowUrlSpec | null,
    /** Arbitrary data describing the expected type and format of the parameter, intended as a reference for catalog maintainers and not used in workflow execution. */
    type_guide?: Any | null,
}


/**
 * Definition of a URL-based data source for a workflow parameter, typically used for reference data or external resources.
 */
export interface WorkflowUrlSpec {
    /** The file extension of the resource at the URL, which determines how Galaxy will interpret the data (e.g., 'fasta', 'gff', 'tabular'). */
    ext: string,
    /** The source type for the parameter, typically 'url' to indicate an external URL source rather than a Galaxy dataset or other source type. */
    src: string,
    /** The complete URL (including http/https protocol) to the external resource that will be used as input to the workflow. */
    url: string,
}



