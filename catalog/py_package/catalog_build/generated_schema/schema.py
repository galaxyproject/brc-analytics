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


linkml_meta = LinkMLMeta(
    {
        "default_prefix": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/schema.yaml#",
        "description": "Combined source data schemas.",
        "id": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/schema.yaml#",
        "imports": [
            "./assemblies",
            "./organisms",
            "./outbreaks",
            "./workflow_categories",
            "./workflows",
        ],
        "name": "schema",
        "prefixes": {
            "linkml": {
                "prefix_prefix": "linkml",
                "prefix_reference": "https://w3id.org/linkml/",
            }
        },
        "source_file": "/home/dcallan-adm/Documents/brc-analytics/brc-analytics/catalog/py_package/catalog_build/schema_utils/../schema/schema.yaml",
    }
)


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
    OTHER = "OTHER"


class WorkflowParameterVariable(str, Enum):
    """
    Possible variables that can be inserted into workflow parameters.
    """

    ASSEMBLY_ID = "ASSEMBLY_ID"
    ASSEMBLY_FASTA_URL = "ASSEMBLY_FASTA_URL"
    GENE_MODEL_URL = "GENE_MODEL_URL"
    SANGER_READ_RUN_PAIRED = "SANGER_READ_RUN_PAIRED"
    SANGER_READ_RUN_SINGLE = "SANGER_READ_RUN_SINGLE"


class WorkflowPloidy(str, Enum):
    """
    Possible ploidies supported by workflows.
    """

    ANY = "ANY"
    DIPLOID = "DIPLOID"
    HAPLOID = "HAPLOID"
    POLYPLOID = "POLYPLOID"


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

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/assemblies.yaml#",
            "tree_root": True,
        }
    )

    assemblies: List[Assembly] = Field(
        default=...,
        description="""Collection of genomic assembly entries that will be available for analysis in the BRC Analytics platform.""",
        json_schema_extra={
            "linkml_meta": {"alias": "assemblies", "domain_of": ["Assemblies"]}
        },
    )


class Assembly(ConfiguredBaseModel):
    """
    Definition of a genomic assembly with its unique identifier.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/assemblies.yaml#"
        }
    )

    accession: str = Field(
        default=...,
        description="""The unique accession identifier for the assembly (e.g., GCA_000001405.28 for GRCh38), used to retrieve the assembly data from public repositories.""",
        json_schema_extra={
            "linkml_meta": {"alias": "accession", "domain_of": ["Assembly"]}
        },
    )


class Organisms(ConfiguredBaseModel):
    """
    Root object containing a collection of organism definitions for the BRC Analytics platform.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/organisms.yaml#",
            "tree_root": True,
        }
    )

    organisms: List[Organism] = Field(
        default=...,
        description="""Collection of organism entries that will be available in the BRC Analytics platform.""",
        json_schema_extra={
            "linkml_meta": {"alias": "organisms", "domain_of": ["Organisms"]}
        },
    )


class Organism(ConfiguredBaseModel):
    """
    Definition of an organism with its taxonomic and genetic characteristics.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/organisms.yaml#"
        }
    )

    taxonomy_id: int = Field(
        default=...,
        description="""An NCBI Taxonomy ID at rank 'species'.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "taxonomy_id",
                "domain_of": ["Organism", "Outbreak", "Workflow"],
            }
        },
    )
    ploidy: List[OrganismPloidy] = Field(
        default=...,
        description="""The possible ploidy states (number of chromosome sets) that the organism may have, which determines compatible workflows.""",
        json_schema_extra={
            "linkml_meta": {"alias": "ploidy", "domain_of": ["Organism", "Workflow"]}
        },
    )


class Outbreaks(ConfiguredBaseModel):
    """
    Root object containing a collection of pathogen definitions for the BRC Analytics platform to highlight as outbreaks/priority pathogens.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/outbreaks.yaml#",
            "tree_root": True,
        }
    )

    outbreaks: List[Outbreak] = Field(
        default=...,
        description="""Collection of pathogen entries that will be displayed in the BRC Analytics platform as outbreaks/priority pathogens.""",
        json_schema_extra={
            "linkml_meta": {"alias": "outbreaks", "domain_of": ["Outbreaks"]}
        },
    )


class Outbreak(ConfiguredBaseModel):
    """
    Definition of a priority pathogen with its taxonomic classification, priority level, and associated resources.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/outbreaks.yaml#"
        }
    )

    name: str = Field(
        default=...,
        description="""The display name of the pathogen as it will appear in the BRC Analytics interface.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "name",
                "domain_of": ["Outbreak", "WorkflowCategory"],
            }
        },
    )
    taxonomy_id: int = Field(
        default=...,
        description="""The NCBI Taxonomy ID for the pathogen. Used to link to relevant genomic data and workflows.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "taxonomy_id",
                "domain_of": ["Organism", "Outbreak", "Workflow"],
            }
        },
    )
    priority: OutbreakPriority = Field(
        default=...,
        description="""The priority level of the pathogen, which determines its visibility and prominence in the BRC Analytics interface.""",
        json_schema_extra={
            "linkml_meta": {"alias": "priority", "domain_of": ["Outbreak"]}
        },
    )
    resources: List[OutbreakResource] = Field(
        default=...,
        description="""Collection of external resources (references, tools, databases) related to the pathogen.""",
        json_schema_extra={
            "linkml_meta": {"alias": "resources", "domain_of": ["Outbreak"]}
        },
    )
    description: MarkdownFileReference = Field(
        default=...,
        description="""Reference to a markdown file containing detailed information about the pathogen.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "description",
                "domain_of": [
                    "Outbreak",
                    "WorkflowCategory",
                    "WorkflowDataRequirements",
                ],
            }
        },
    )
    active: bool = Field(
        default=...,
        description="""Boolean flag that determines if the pathogen should be included in the BRC Analytics interface. Used to manage visibility as pathogen relevance changes over time.""",
        json_schema_extra={
            "linkml_meta": {"alias": "active", "domain_of": ["Outbreak", "Workflow"]}
        },
    )
    highlight_descendant_taxonomy_ids: Optional[List[int]] = Field(
        default=None,
        description="""List of NCBI Taxonomy IDs for descendant taxa (e.g., specific strains or serotypes) that should be highlighted within the outbreak category.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "highlight_descendant_taxonomy_ids",
                "domain_of": ["Outbreak"],
            }
        },
    )


class OutbreakResource(ConfiguredBaseModel):
    """
    Definition of an external resource (reference, tool, database) associated with a priority pathogen.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/outbreaks.yaml#"
        }
    )

    url: str = Field(
        default=...,
        description="""The complete URL (including http/https protocol) to the external resource.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "url",
                "domain_of": ["OutbreakResource", "WorkflowUrlSpec"],
            }
        },
    )
    title: str = Field(
        default=...,
        description="""The display title for the resource link as it will appear in the BRC Analytics interface.""",
        json_schema_extra={
            "linkml_meta": {"alias": "title", "domain_of": ["OutbreakResource"]}
        },
    )
    type: OutbreakResourceType = Field(
        default=...,
        description="""The category or type of the resource (e.g., REFERENCE, TOOL, DATABASE), which determines how it is displayed and organized.""",
        json_schema_extra={
            "linkml_meta": {"alias": "type", "domain_of": ["OutbreakResource"]}
        },
    )


class MarkdownFileReference(ConfiguredBaseModel):
    """
    A reference to a markdown file containing detailed content about a priority pathogen.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/outbreaks.yaml#"
        }
    )

    path: str = Field(
        default=...,
        description="""Relative path to the markdown file from the project root. Must end with .md extension.""",
        json_schema_extra={
            "linkml_meta": {"alias": "path", "domain_of": ["MarkdownFileReference"]}
        },
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

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/workflow_categories.yaml#",
            "tree_root": True,
        }
    )

    workflow_categories: List[WorkflowCategory] = Field(
        default=...,
        description="""Collection of workflow category entries that will be used to group and organize workflows in the BRC Analytics interface.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "workflow_categories",
                "domain_of": ["WorkflowCategories"],
            }
        },
    )


class WorkflowCategory(ConfiguredBaseModel):
    """
    Definition of a workflow category used to group related workflows for organization and display purposes.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/workflow_categories.yaml#"
        }
    )

    category: WorkflowCategoryId = Field(
        default=...,
        description="""The unique identifier for the workflow category, used to link workflows to their respective categories.""",
        json_schema_extra={
            "linkml_meta": {"alias": "category", "domain_of": ["WorkflowCategory"]}
        },
    )
    name: str = Field(
        default=...,
        description="""The human-readable display name of the workflow category as it will appear in the BRC Analytics interface.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "name",
                "domain_of": ["Outbreak", "WorkflowCategory"],
            }
        },
    )
    description: str = Field(
        default=...,
        description="""A detailed description of the workflow category explaining its purpose and the types of workflows it contains.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "description",
                "domain_of": [
                    "Outbreak",
                    "WorkflowCategory",
                    "WorkflowDataRequirements",
                ],
            }
        },
    )
    show_coming_soon: bool = Field(
        default=...,
        description="""Boolean flag that determines whether to display a 'Coming Soon' indicator for this category in the BRC Analytics interface when workflows in this category are not yet available.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "show_coming_soon",
                "domain_of": ["WorkflowCategory"],
            }
        },
    )


class Workflows(ConfiguredBaseModel):
    """
    Root object containing a collection of Galaxy workflow definitions for the BRC Analytics platform.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/workflows.yaml#",
            "tree_root": True,
        }
    )

    workflows: List[Workflow] = Field(
        default=...,
        description="""Collection of workflow entries that will be available to users in the BRC Analytics platform.""",
        json_schema_extra={
            "linkml_meta": {"alias": "workflows", "domain_of": ["Workflows"]}
        },
    )


class Workflow(ConfiguredBaseModel):
    """
    Definition of a Galaxy workflow with its metadata, parameters, and organism compatibility information.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/workflows.yaml#"
        }
    )

    trs_id: str = Field(
        default=...,
        description="""The Tool Repository Service (TRS) identifier for the workflow, used to locate and retrieve the workflow from a Galaxy server.""",
        json_schema_extra={
            "linkml_meta": {"alias": "trs_id", "domain_of": ["Workflow"]}
        },
    )
    categories: List[WorkflowCategoryId] = Field(
        default=...,
        description="""List of category identifiers that this workflow belongs to, determining how it is organized and displayed in the BRC Analytics interface.""",
        json_schema_extra={
            "linkml_meta": {"alias": "categories", "domain_of": ["Workflow"]}
        },
    )
    workflow_name: str = Field(
        default=...,
        description="""The human-readable display name of the workflow as it will appear in the BRC Analytics interface.""",
        json_schema_extra={
            "linkml_meta": {"alias": "workflow_name", "domain_of": ["Workflow"]}
        },
    )
    workflow_description: str = Field(
        default=...,
        description="""A detailed description of the workflow's purpose, functionality, and expected outputs for users.""",
        json_schema_extra={
            "linkml_meta": {"alias": "workflow_description", "domain_of": ["Workflow"]}
        },
    )
    ploidy: WorkflowPloidy = Field(
        default=...,
        description="""The ploidy state (number of chromosome sets) that this workflow is designed to work with, ensuring compatibility with organism data.""",
        json_schema_extra={
            "linkml_meta": {"alias": "ploidy", "domain_of": ["Organism", "Workflow"]}
        },
    )
    taxonomy_id: Optional[int] = Field(
        default=None,
        description="""The NCBI Taxonomy ID of the organism this workflow is designed for. If specified, the workflow will be available for all assemblies with this ID in their taxonomic lineage.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "taxonomy_id",
                "domain_of": ["Organism", "Outbreak", "Workflow"],
            }
        },
    )
    parameters: List[WorkflowParameter] = Field(
        default=...,
        description="""Collection of input parameters that will be passed to the workflow when it is executed, including data sources and configuration options.""",
        json_schema_extra={
            "linkml_meta": {"alias": "parameters", "domain_of": ["Workflow"]}
        },
    )
    active: bool = Field(
        default=...,
        description="""Boolean flag that determines if the workflow should be included in the BRC Analytics interface. Used to manage visibility of workflows that may be under development or deprecated.""",
        json_schema_extra={
            "linkml_meta": {"alias": "active", "domain_of": ["Outbreak", "Workflow"]}
        },
    )
    iwc_id: str = Field(
        default=...,
        description="""The Intergalactic Workflow Commission (IWC) identifier for the workflow, used to link to the workflow's page on the IWC website.""",
        json_schema_extra={
            "linkml_meta": {"alias": "iwc_id", "domain_of": ["Workflow"]}
        },
    )


class WorkflowDataRequirements(ConfiguredBaseModel):
    """
    Specification of data requirements for a workflow parameter, such as library strategy and layout.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/workflows.yaml#"
        }
    )

    library_strategy: Optional[List[LibraryStrategy]] = Field(
        default=None,
        description="""The library strategy values that are acceptable for this parameter (e.g., 'WGS', 'RNA-Seq').""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "library_strategy",
                "domain_of": ["WorkflowDataRequirements"],
            }
        },
    )
    library_layout: Optional[LibraryLayout] = Field(
        default=None,
        description="""The library layout that is required for this parameter (e.g., 'PAIRED', 'SINGLE').""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "library_layout",
                "domain_of": ["WorkflowDataRequirements"],
            }
        },
    )
    library_source: Optional[List[LibrarySource]] = Field(
        default=None,
        description="""The library source values that are acceptable for this parameter (e.g., 'GENOMIC', 'TRANSCRIPTOMIC SINGLE CELL').""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "library_source",
                "domain_of": ["WorkflowDataRequirements"],
            }
        },
    )
    description: Optional[str] = Field(
        default=None,
        description="""A descriptive text to provide additional context about the data requirements, useful for non-standard library strategies like 'OTHER'.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "description",
                "domain_of": [
                    "Outbreak",
                    "WorkflowCategory",
                    "WorkflowDataRequirements",
                ],
            }
        },
    )


class WorkflowParameter(ConfiguredBaseModel):
    """
    Definition of an input parameter for a Galaxy workflow, specifying how the parameter value should be determined when the workflow is executed.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/workflows.yaml#"
        }
    )

    key: str = Field(
        default=...,
        description="""The identifier for the parameter as expected by the Galaxy workflow, used to map the parameter value to the correct input.""",
        json_schema_extra={
            "linkml_meta": {"alias": "key", "domain_of": ["WorkflowParameter"]}
        },
    )
    variable: Optional[WorkflowParameterVariable] = Field(
        default=None,
        description="""A predefined variable that will be substituted as the value of the parameter at runtime, such as assembly information.""",
        json_schema_extra={
            "linkml_meta": {"alias": "variable", "domain_of": ["WorkflowParameter"]}
        },
    )
    url_spec: Optional[WorkflowUrlSpec] = Field(
        default=None,
        description="""A direct URL specification for the parameter, allowing for external data sources to be provided to the workflow.""",
        json_schema_extra={
            "linkml_meta": {"alias": "url_spec", "domain_of": ["WorkflowParameter"]}
        },
    )
    data_requirements: Optional[WorkflowDataRequirements] = Field(
        default=None,
        description="""Specifications for the data requirements of this parameter, such as library strategy and layout.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "data_requirements",
                "domain_of": ["WorkflowParameter"],
            }
        },
    )
    type_guide: Optional[Any] = Field(
        default=None,
        description="""Arbitrary data describing the expected type and format of the parameter, intended as a reference for catalog maintainers and not used in workflow execution.""",
        json_schema_extra={
            "linkml_meta": {"alias": "type_guide", "domain_of": ["WorkflowParameter"]}
        },
    )


class WorkflowUrlSpec(ConfiguredBaseModel):
    """
    Definition of a URL-based data source for a workflow parameter, typically used for reference data or external resources.
    """

    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta(
        {
            "from_schema": "https://github.com/galaxyproject/brc-analytics/blob/main/catalog/py_package/catalog_build/schema/workflows.yaml#"
        }
    )

    ext: str = Field(
        default=...,
        description="""The file extension of the resource at the URL, which determines how Galaxy will interpret the data (e.g., 'fasta', 'gff', 'tabular').""",
        json_schema_extra={
            "linkml_meta": {"alias": "ext", "domain_of": ["WorkflowUrlSpec"]}
        },
    )
    src: str = Field(
        default=...,
        description="""The source type for the parameter, typically 'url' to indicate an external URL source rather than a Galaxy dataset or other source type.""",
        json_schema_extra={
            "linkml_meta": {"alias": "src", "domain_of": ["WorkflowUrlSpec"]}
        },
    )
    url: str = Field(
        default=...,
        description="""The complete URL (including http/https protocol) to the external resource that will be used as input to the workflow.""",
        json_schema_extra={
            "linkml_meta": {
                "alias": "url",
                "domain_of": ["OutbreakResource", "WorkflowUrlSpec"],
            }
        },
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
WorkflowParameter.model_rebuild()
WorkflowUrlSpec.model_rebuild()
