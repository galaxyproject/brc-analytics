from __future__ import annotations

import re
import sys
from datetime import date, datetime, time
from decimal import Decimal
from enum import Enum
from typing import Any, ClassVar, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, RootModel, field_validator

metamodel_version = "None"
version = "None"


class ConfiguredBaseModel(BaseModel):
    model_config = ConfigDict(
        validate_assignment=True,
        validate_default=True,
        extra="forbid",
        arbitrary_types_allowed=True,
        use_enum_values=True,
        strict=False,
    )
    pass


class LinkMLMeta(RootModel):
    root: Dict[str, Any] = {}
    model_config = ConfigDict(frozen=True)

    def __getattr__(self, key: str):
        return getattr(self.root, key)

    def __getitem__(self, key: str):
        return self.root[key]

    def __setitem__(self, key: str, value):
        self.root[key] = value

    def __contains__(self, key: str) -> bool:
        return key in self.root


linkml_meta = None


class OrganismPloidy(str, Enum):
    """
    Possible ploidies of an organism.
    """

    DIPLOID = "DIPLOID"
    HAPLOID = "HAPLOID"
    POLYPLOID = "POLYPLOID"


class OutbreakPriority(str, Enum):
    """
    Possible priorities of an outbreak.
    """

    HIGHEST = "HIGHEST"
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE_HIGH = "MODERATE_HIGH"
    MODERATE = "MODERATE"


class OutbreakResourceType(str, Enum):
    """
    Possible types of an outbreak resource.
    """

    PUBLICATION = "PUBLICATION"
    REFERENCE = "REFERENCE"
    NEWS = "NEWS"
    WORKFLOW = "WORKFLOW"
    DATA = "DATA"
    OTHER = "OTHER"
    HGPHYLOPLACE = "HGPHYLOPLACE"


class WorkflowCategoryId(str, Enum):
    """
    Set of IDs of workflow categories.
    """

    VARIANT_CALLING = "VARIANT_CALLING"
    TRANSCRIPTOMICS = "TRANSCRIPTOMICS"
    REGULATION = "REGULATION"
    ASSEMBLY = "ASSEMBLY"
    GENOME_COMPARISONS = "GENOME_COMPARISONS"
    PROTEIN_FOLDING = "PROTEIN_FOLDING"
    CONSENSUS_SEQUENCES = "CONSENSUS_SEQUENCES"
    ANNOTATION = "ANNOTATION"
    COMPARATIVE_GENOMICS = "COMPARATIVE_GENOMICS"
    OTHER = "OTHER"


class CollectionType(str, Enum):
    """
        Galaxy collection types supported for collection_spec in workflow parameters.
    Currently only 'list' collections are supported, which represent a simple ordered list of datasets.
    """

    # A simple ordered list of datasets. Each element in the collection is a separate dataset.
    list = "list"


class WorkflowParameterVariable(str, Enum):
    """
    Possible variables that can be inserted into workflow parameters.
    """

    ASSEMBLY_ID = "ASSEMBLY_ID"
    ASSEMBLY_FASTA_URL = "ASSEMBLY_FASTA_URL"
    FASTA_COLLECTION = "FASTA_COLLECTION"
    GENE_MODEL_URL = "GENE_MODEL_URL"
    SANGER_READ_RUN_FORWARD_FILE = "SANGER_READ_RUN_FORWARD_FILE"
    SANGER_READ_RUN_PAIRED = "SANGER_READ_RUN_PAIRED"
    SANGER_READ_RUN_REVERSE_FILE = "SANGER_READ_RUN_REVERSE_FILE"
    SANGER_READ_RUN_SINGLE = "SANGER_READ_RUN_SINGLE"
    SANGER_READ_RUN_SINGLE_FILE = "SANGER_READ_RUN_SINGLE_FILE"


class WorkflowPloidy(str, Enum):
    """
    Possible ploidies supported by workflows.
    """

    ANY = "ANY"
    DIPLOID = "DIPLOID"
    HAPLOID = "HAPLOID"
    POLYPLOID = "POLYPLOID"


class WorkflowScope(str, Enum):
    """
    The scope level at which a workflow operates, determining its display context and required inputs.
    """

    # Workflow operates on a specific genome assembly and requires assembly selection as the first step.
    ASSEMBLY = "ASSEMBLY"
    # Workflow operates at the organism level, either requiring no specific assembly or working across multiple assemblies.
    ORGANISM = "ORGANISM"
    # Workflow operates on a user-provided sequence (e.g., single gene) rather than a full genome assembly.
    SEQUENCE = "SEQUENCE"


class LibraryLayout(str, Enum):
    """
    Enumeration of possible library layouts for sequencing data.
    """

    # Paired-end sequencing reads
    PAIRED = "PAIRED"
    # Single-end sequencing reads
    SINGLE = "SINGLE"


class LibrarySource(str, Enum):
    """
    Enumeration of possible library sources for sequencing data.
    """

    # Genomic DNA (includes PCR products from genomic DNA)
    GENOMIC = "GENOMIC"
    # Genomic DNA from a single cell
    GENOMIC_SINGLE_CELL = "GENOMIC SINGLE CELL"
    # Transcription products or non-genomic DNA (EST, cDNA, RT-PCR, screened libraries)
    TRANSCRIPTOMIC = "TRANSCRIPTOMIC"
    # Transcription products from a single cell
    TRANSCRIPTOMIC_SINGLE_CELL = "TRANSCRIPTOMIC SINGLE CELL"
    # Mixed material from metagenome
    METAGENOMIC = "METAGENOMIC"
    # Transcription products from community targets
    METATRANSCRIPTOMIC = "METATRANSCRIPTOMIC"
    # Synthetic DNA
    SYNTHETIC = "SYNTHETIC"
    # Viral RNA
    VIRAL_RNA = "VIRAL RNA"
    # Other, unspecified, or unknown library source material
    OTHER = "OTHER"


class LibraryStrategy(str, Enum):
    """
    Enumeration of possible library strategies for sequencing data.
    """

    # Whole genome sequencing
    WGS = "WGS"
    # Whole genome amplification
    WGA = "WGA"
    # Whole exome sequencing
    WXS = "WXS"
    # RNA sequencing
    RNA_Seq = "RNA-Seq"
    # Small nuclear RNA sequencing
    snRNA_seq = "snRNA-seq"
    # Single-stranded RNA sequencing
    ssRNA_seq = "ssRNA-seq"
    # microRNA sequencing
    miRNA_Seq = "miRNA-Seq"
    # Non-coding RNA sequencing
    ncRNA_Seq = "ncRNA-Seq"
    # Full-length cDNA sequencing
    FL_cDNA = "FL-cDNA"
    # Expressed sequence tag
    EST = "EST"
    # Chromosome conformation capture
    Hi_C = "Hi-C"
    # Assay for transposase-accessible chromatin sequencing
    ATAC_seq = "ATAC-seq"
    # Whole chromosome sequencing
    WCS = "WCS"
    # Restriction site associated DNA sequencing
    RAD_Seq = "RAD-Seq"
    # Clone sequencing
    CLONE = "CLONE"
    # Pooled clone sequencing
    POOLCLONE = "POOLCLONE"
    # Amplicon sequencing
    AMPLICON = "AMPLICON"
    # Clone end sequencing
    CLONEEND = "CLONEEND"
    # Sequencing intended to close gaps in a genome assembly
    FINISHING = "FINISHING"
    # Chromatin immunoprecipitation sequencing
    ChIP_Seq = "ChIP-Seq"
    # Micrococcal nuclease sequencing
    MNase_Seq = "MNase-Seq"
    # Ribosome profiling
    Ribo_Seq = "Ribo-Seq"
    # DNase hypersensitivity sequencing
    DNase_Hypersensitivity = "DNase-Hypersensitivity"
    # Bisulfite sequencing
    Bisulfite_Seq = "Bisulfite-Seq"
    # Concatenated tag sequencing
    CTS = "CTS"
    # ChIPmentation combines chromatin immunoprecipitation with sequencing library preparation by Tn5 transposase
    ChM_Seq = "ChM-Seq"
    # Genotyping by sequencing
    GBS = "GBS"
    # Methylation-sensitive restriction enzyme sequencing
    MRE_Seq = "MRE-Seq"
    # Methylated DNA immunoprecipitation sequencing
    MeDIP_Seq = "MeDIP-Seq"
    # Methyl-CpG binding domain sequencing
    MBD_Seq = "MBD-Seq"
    # Nucleosome occupancy and methylome sequencing
    NOMe_Seq = "NOMe-Seq"
    # Quantitatively determine fitness of bacterial genes based on how many times a purposely seeded transposon gets inserted into each gene of a colony after some time.
    Tn_Seq = "Tn-Seq"
    # Independent experiment to re-evaluate putative variants
    VALIDATION = "VALIDATION"
    # Formaldehyde-assisted isolation of regulatory elements sequencing
    FAIRE_seq = "FAIRE-seq"
    # Systematic evolution of ligands by exponential enrichment sequencing
    SELEX = "SELEX"
    # RNA immunoprecipitation sequencing
    RIP_Seq = "RIP-Seq"
    # Direct sequencing of proximity-ligated chromatin immunoprecipitates
    ChIA_PET = "ChIA-PET"
    # Binning and barcoding of large DNA fragments to facilitate assembly of the fragment
    Synthetic_Long_Read = "Synthetic-Long-Read"
    # Enrichment of a targeted subset of loci
    Targeted_Capture = "Targeted-Capture"
    # Tethered chromosome conformation capture
    Tethered_Chromatin_Conformation_Capture = "Tethered Chromatin Conformation Capture"
    # Other, unspecified, or unknown library strategy
    OTHER = "OTHER"


class Assemblies(ConfiguredBaseModel):
    """
    Root object containing a collection of genomic assembly definitions for the BRC Analytics platform.
    """

    assemblies: List[Assembly] = Field(
        default=...,
        description="""Collection of genomic assembly entries that will be available for analysis in the BRC Analytics platform.""",
    )


class Assembly(ConfiguredBaseModel):
    """
    Definition of a genomic assembly with its unique identifier.
    """

    accession: str = Field(
        default=...,
        description="""The unique accession identifier for the assembly (e.g., GCA_000001405.28 for GRCh38), used to retrieve the assembly data from public repositories.""",
    )


class Organisms(ConfiguredBaseModel):
    """
    Root object containing a collection of organism definitions for the BRC Analytics platform.
    """

    organisms: List[Organism] = Field(
        default=...,
        description="""Collection of organism entries that will be available in the BRC Analytics platform.""",
    )


class Organism(ConfiguredBaseModel):
    """
    Definition of an organism with its taxonomic and genetic characteristics.
    """

    taxonomy_id: int = Field(
        default=..., description="""An NCBI Taxonomy ID at rank 'species'."""
    )
    ploidy: List[OrganismPloidy] = Field(
        default=...,
        description="""The possible ploidy states (number of chromosome sets) that the organism may have, which determines compatible workflows.""",
    )


class Outbreaks(ConfiguredBaseModel):
    """
    Root object containing a collection of pathogen definitions for the BRC Analytics platform to highlight as outbreaks/priority pathogens.
    """

    outbreaks: List[Outbreak] = Field(
        default=...,
        description="""Collection of pathogen entries that will be displayed in the BRC Analytics platform as outbreaks/priority pathogens.""",
    )


class Outbreak(ConfiguredBaseModel):
    """
    Definition of a priority pathogen with its taxonomic classification, priority level, and associated resources.
    """

    name: str = Field(
        default=...,
        description="""The display name of the pathogen as it will appear in the BRC Analytics interface.""",
    )
    taxonomy_id: int = Field(
        default=...,
        description="""The NCBI Taxonomy ID for the pathogen. Used to link to relevant genomic data and workflows.""",
    )
    priority: OutbreakPriority = Field(
        default=...,
        description="""The priority level of the pathogen, which determines its visibility and prominence in the BRC Analytics interface.""",
    )
    resources: List[OutbreakResource] = Field(
        default=...,
        description="""Collection of external resources (references, tools, databases) related to the pathogen.""",
    )
    description: MarkdownFileReference = Field(
        default=...,
        description="""Reference to a markdown file containing detailed information about the pathogen.""",
    )
    active: bool = Field(
        default=...,
        description="""Boolean flag that determines if the pathogen should be included in the BRC Analytics interface. Used to manage visibility as pathogen relevance changes over time.""",
    )
    highlight_descendant_taxonomy_ids: Optional[List[int]] = Field(
        default=None,
        description="""List of NCBI Taxonomy IDs for descendant taxa (e.g., specific strains or serotypes) that should be highlighted within the outbreak category.""",
    )


class OutbreakResource(ConfiguredBaseModel):
    """
    Definition of an external resource (reference, tool, database) associated with a priority pathogen.
    """

    url: str = Field(
        default=...,
        description="""The complete URL (including http/https protocol) to the external resource.""",
    )
    title: str = Field(
        default=...,
        description="""The display title for the resource link as it will appear in the BRC Analytics interface.""",
    )
    type: OutbreakResourceType = Field(
        default=...,
        description="""The category or type of the resource (e.g., REFERENCE, TOOL, DATABASE), which determines how it is displayed and organized.""",
    )


class MarkdownFileReference(ConfiguredBaseModel):
    """
    A reference to a markdown file containing detailed content about a priority pathogen.
    """

    path: str = Field(
        default=...,
        description="""Relative path to the markdown file from the project root. Must end with .md extension.""",
    )

    @field_validator("path")
    def pattern_path(cls, v):
        pattern = re.compile(r".*\.md$")
        if isinstance(v, list):
            for element in v:
                if isinstance(v, str) and not pattern.match(element):
                    raise ValueError(f"Invalid path format: {element}")
        elif isinstance(v, str):
            if not pattern.match(v):
                raise ValueError(f"Invalid path format: {v}")
        return v


class WorkflowCategories(ConfiguredBaseModel):
    """
    Root object containing a collection of workflow category definitions used to organize workflows in the BRC Analytics platform.
    """

    workflow_categories: List[WorkflowCategory] = Field(
        default=...,
        description="""Collection of workflow category entries that will be used to group and organize workflows in the BRC Analytics interface.""",
    )


class WorkflowCategory(ConfiguredBaseModel):
    """
    Definition of a workflow category used to group related workflows for organization and display purposes.
    """

    category: WorkflowCategoryId = Field(
        default=...,
        description="""The unique identifier for the workflow category, used to link workflows to their respective categories.""",
    )
    name: str = Field(
        default=...,
        description="""The human-readable display name of the workflow category as it will appear in the BRC Analytics interface.""",
    )
    description: str = Field(
        default=...,
        description="""A detailed description of the workflow category explaining its purpose and the types of workflows it contains.""",
    )
    show_coming_soon: bool = Field(
        default=...,
        description="""Boolean flag that determines whether to display a 'Coming Soon' indicator for this category in the BRC Analytics interface when workflows in this category are not yet available.""",
    )


class Workflows(ConfiguredBaseModel):
    """
    Root object containing a collection of Galaxy workflow definitions for the BRC Analytics platform.
    """

    workflows: List[Workflow] = Field(
        default=...,
        description="""Collection of workflow entries that will be available to users in the BRC Analytics platform.""",
    )


class Workflow(ConfiguredBaseModel):
    """
    Definition of a Galaxy workflow with its metadata, parameters, and organism compatibility information.
    """

    trs_id: str = Field(
        default=...,
        description="""The Tool Repository Service (TRS) identifier for the workflow, used to locate and retrieve the workflow from a Galaxy server.""",
    )
    categories: List[WorkflowCategoryId] = Field(
        default=...,
        description="""List of category identifiers that this workflow belongs to, determining how it is organized and displayed in the BRC Analytics interface.""",
    )
    workflow_name: str = Field(
        default=...,
        description="""The human-readable display name of the workflow as it will appear in the BRC Analytics interface.""",
    )
    workflow_description: str = Field(
        default=...,
        description="""A detailed description of the workflow's purpose, functionality, and expected outputs for users.""",
    )
    ploidy: WorkflowPloidy = Field(
        default=...,
        description="""The ploidy state (number of chromosome sets) that this workflow is designed to work with, ensuring compatibility with organism data.""",
    )
    scope: Optional[WorkflowScope] = Field(
        default=None,
        description="""The scope level at which this workflow operates, determining where it is displayed in the UI and what the first configuration step should be. Defaults to ASSEMBLY for backward compatibility.""",
    )
    assembly_count_min: Optional[int] = Field(
        default=None,
        description="""The minimum number of genome assemblies a user must select for this workflow. Defaults to 1 for ASSEMBLY-scope workflows; must be set explicitly for ORGANISM and SEQUENCE scope. Use 0 for workflows that take no user-selected assemblies (e.g. assembly-building or curated-FASTA workflows).""",
    )
    assembly_count_max: Optional[int] = Field(
        default=None,
        description="""The maximum number of genome assemblies a user may select for this workflow. Null/absent means no upper limit. Defaults to 1 for ASSEMBLY-scope workflows; must be set explicitly for ORGANISM and SEQUENCE scope.""",
    )
    taxonomy_id: Optional[int] = Field(
        default=None,
        description="""The NCBI Taxonomy ID of the organism this workflow is designed for. If specified, the workflow will be available for all assemblies with this ID in their taxonomic lineage.""",
    )
    parameters: List[WorkflowParameter] = Field(
        default=...,
        description="""Collection of input parameters that will be passed to the workflow when it is executed, including data sources and configuration options.""",
    )
    active: bool = Field(
        default=...,
        description="""Boolean flag that determines if the workflow should be included in the BRC Analytics interface. Used to manage visibility of workflows that may be under development or deprecated.""",
    )
    iwc_id: str = Field(
        default=...,
        description="""The Intergalactic Workflow Commission (IWC) identifier for the workflow, used to link to the workflow's page on the IWC website.""",
    )


class WorkflowDataRequirements(ConfiguredBaseModel):
    """
    Specification of data requirements for a workflow parameter, such as library strategy and layout.
    """

    library_strategy: Optional[List[LibraryStrategy]] = Field(
        default=None,
        description="""The library strategy values that are acceptable for this parameter (e.g., 'WGS', 'RNA-Seq').""",
    )
    library_layout: Optional[LibraryLayout] = Field(
        default=None,
        description="""The library layout that is required for this parameter (e.g., 'PAIRED', 'SINGLE').""",
    )
    library_source: Optional[List[LibrarySource]] = Field(
        default=None,
        description="""The library source values that are acceptable for this parameter (e.g., 'GENOMIC', 'TRANSCRIPTOMIC SINGLE CELL').""",
    )
    description: Optional[str] = Field(
        default=None,
        description="""A descriptive text to provide additional context about the data requirements, useful for non-standard library strategies like 'OTHER'.""",
    )


class WorkflowCollectionSpec(ConfiguredBaseModel):
    """
    Definition of a collection-based data source for a workflow parameter, allowing multiple files to be grouped into a Galaxy collection.

    Example usage for hard-coded FASTA references:
    ```yaml
    collection_spec:
      collection_type: list
      name: Influenza Segment References
      elements:
        - ext: fasta
          src: url
          url: https://zenodo.org/record/123/files/segment1.fasta
          md5: abc123...
        - ext: fasta
          src: url
          url: https://zenodo.org/record/123/files/segment2.fasta
          md5: def456...
    ```
    """

    collection_type: CollectionType = Field(
        default=...,
        description="""The type of Galaxy collection to create. Currently only 'list' is supported. Determines the structure of the collection.""",
    )
    elements: List[WorkflowUrlSpec] = Field(
        default=...,
        description="""Array of URL specifications that will become elements in the collection. Each element represents a file to include in the collection. Must contain at least one element.""",
        min_length=1,
    )
    name: Optional[str] = Field(
        default=None,
        description="""Optional identifier for the collection, used as the collection name in Galaxy. If not provided, defaults to 'Collection'.""",
    )


class WorkflowParameter(ConfiguredBaseModel):
    """
    Definition of an input parameter for a Galaxy workflow, specifying how the parameter value should be determined when the workflow is executed.
    """

    key: str = Field(
        default=...,
        description="""The identifier for the parameter as expected by the Galaxy workflow, used to map the parameter value to the correct input.""",
    )
    variable: Optional[WorkflowParameterVariable] = Field(
        default=None,
        description="""A predefined variable that will be substituted as the value of the parameter at runtime, such as assembly information.""",
    )
    collection_spec: Optional[WorkflowCollectionSpec] = Field(
        default=None,
        description="""A collection specification for the parameter, allowing multiple files from external sources to be provided as a Galaxy collection.""",
    )
    url_spec: Optional[WorkflowUrlSpec] = Field(
        default=None,
        description="""A direct URL specification for the parameter, allowing for external data sources to be provided to the workflow.""",
    )
    data_requirements: Optional[WorkflowDataRequirements] = Field(
        default=None,
        description="""Specifications for the data requirements of this parameter, such as library strategy and layout.""",
    )
    type_guide: Optional[Any] = Field(
        default=None,
        description="""Arbitrary data describing the expected type and format of the parameter, intended as a reference for catalog maintainers and not used in workflow execution.""",
    )


class WorkflowUrlSpec(ConfiguredBaseModel):
    """
    Definition of a URL-based data source for a workflow parameter, typically used for reference data or external resources.
    """

    ext: str = Field(
        default=...,
        description="""The file extension of the resource at the URL, which determines how Galaxy will interpret the data (e.g., 'fasta', 'gff', 'tabular').""",
    )
    src: str = Field(
        default=...,
        description="""The source type for the parameter, typically 'url' to indicate an external URL source rather than a Galaxy dataset or other source type.""",
    )
    url: str = Field(
        default=...,
        description="""The complete URL (including http/https protocol) to the external resource that will be used as input to the workflow.""",
    )
    db_key: Optional[str] = Field(
        default=None,
        description="""Optional database key (genome build) to associate with this file, used by Galaxy to link the file to a specific reference genome.""",
    )
    md5: Optional[str] = Field(
        default=None,
        description="""Optional MD5 checksum hash for file integrity verification.""",
    )


# Model rebuild
# see https://pydantic-docs.helpmanual.io/usage/models/#rebuilding-a-model
Assemblies.model_rebuild()
Assembly.model_rebuild()
Organisms.model_rebuild()
Organism.model_rebuild()
Outbreaks.model_rebuild()
Outbreak.model_rebuild()
OutbreakResource.model_rebuild()
MarkdownFileReference.model_rebuild()
WorkflowCategories.model_rebuild()
WorkflowCategory.model_rebuild()
Workflows.model_rebuild()
Workflow.model_rebuild()
WorkflowDataRequirements.model_rebuild()
WorkflowCollectionSpec.model_rebuild()
WorkflowParameter.model_rebuild()
WorkflowUrlSpec.model_rebuild()
