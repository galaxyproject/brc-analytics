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
    MODERATE_HIGH = "MODERATE-HIGH",
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
    SANGER_READ_RUN = "SANGER_READ_RUN",
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
 * Object containing list of assemblies.
 */
export interface Assemblies {
    /** List of assemblies. */
    assemblies: Assembly[],
}


/**
 * An assembly.
 */
export interface Assembly {
    /** The assembly's accession. */
    accession: string,
}


/**
 * Object containing list of organisms.
 */
export interface Organisms {
    /** List of organisms. */
    organisms: Organism[],
}


/**
 * Info for an organism.
 */
export interface Organism {
    /** The organism's NCBI taxonomy ID. */
    taxonomy_id: number,
    /** The ploidies that the organism may have. */
    ploidy: OrganismPloidy[],
}


/**
 * Object containing list of outbreaks.
 */
export interface Outbreaks {
    /** List of outbreaks. */
    outbreaks: Outbreak[],
}


/**
 * Info for an outbreak.
 */
export interface Outbreak {
    /** The outbreak's NCBI taxonomy ID. */
    taxonomy_id: number,
    /** The priority of the outbreak. */
    priority: OutbreakPriority,
    /** The resources associated with the outbreak. */
    resources: OutbreakResource[],
    /** The description of the outbreak. */
    description: MarkdownFileReference,
    /** Determines if outbreak should be included, as they presumably change over time. */
    active: boolean,
    /** Taxonomy IDs of child taxa that should be highlighted. */
    highlight_descendant_taxonomy_ids?: number[] | null,
}


/**
 * A resource associated with an outbreak.
 */
export interface OutbreakResource {
    /** The URL of the resource. */
    url: string,
    /** The title of the resource. */
    title: string,
    /** The type of the resource. */
    type: OutbreakResourceType,
}


/**
 * A reference to a markdown file
 */
export interface MarkdownFileReference {
    /** Path to the markdown file */
    path: string,
}


/**
 * Object containing list of workflow categories.
 */
export interface WorkflowCategories {
    /** List of workflow categories. */
    workflow_categories: WorkflowCategory[],
}


/**
 * Workflow category.
 */
export interface WorkflowCategory {
    /** The ID of the workflow category. */
    category: WorkflowCategoryId,
    /** The display name of the workflow category. */
    name: string,
    /** The description of the workflow category. */
    description: string,
    /** Whether to show 'Coming Soon' for the workflow category when it is not available. */
    show_coming_soon: boolean,
}


/**
 * Placeholder type; used avoid unnecessary restrictions on the `type_guide` slot.
 */
export interface Any {
}


/**
 * Object containing list of workflows.
 */
export interface Workflows {
    /** List of workflows. */
    workflows: Workflow[],
}


/**
 * A workflow.
 */
export interface Workflow {
    /** The workflow's TRS ID. */
    trs_id: string,
    /** The IDs of the categories the workflow belongs to. */
    categories: WorkflowCategoryId[],
    /** The display name of the workflow. */
    workflow_name: string,
    /** The description of the workflow. */
    workflow_description: string,
    /** The ploidy supported by the workflow. */
    ploidy: WorkflowPloidy,
    /** The NCBI ID of the taxon supported by the workflow. */
    taxonomy_id?: number | null,
    /** The parameters of the workflow. */
    parameters: WorkflowParameter[],
    /** Determines if workflow should be included. */
    active: boolean,
}


/**
 * A parameter that is provided to a workflow; must include a source for the parameter's value in order to be provided.
 */
export interface WorkflowParameter {
    /** The key in which the parameter will be set. */
    key: string,
    /** A variable to substitute in as the value of the parameter. */
    variable?: WorkflowParameterVariable | null,
    /** A direct URL specification for the parameter. */
    url_spec?: WorkflowUrlSpec | null,
    /** Arbitrary data describing the type of the parameter, intended only as convenient reference for maintainers. */
    type_guide?: Any | null,
}


/**
 * A URL specification for a workflow parameter.
 */
export interface WorkflowUrlSpec {
    /** The file extension of the URL. */
    ext: string,
    /** The source type, typically 'url'. */
    src: string,
    /** The URL to the resource. */
    url: string,
}



