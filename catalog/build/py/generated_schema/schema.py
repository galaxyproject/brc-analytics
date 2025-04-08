from __future__ import annotations 

import re
import sys
from datetime import (
    date,
    datetime,
    time
)
from decimal import Decimal 
from enum import Enum 
from typing import (
    Any,
    ClassVar,
    Dict,
    List,
    Literal,
    Optional,
    Union
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    RootModel,
    field_validator
)


metamodel_version = "None"
version = "None"


class ConfiguredBaseModel(BaseModel):
    model_config = ConfigDict(
        validate_assignment = True,
        validate_default = True,
        extra = "forbid",
        arbitrary_types_allowed = True,
        use_enum_values = True,
        strict = False,
    )
    pass




class LinkMLMeta(RootModel):
    root: Dict[str, Any] = {}
    model_config = ConfigDict(frozen=True)

    def __getattr__(self, key:str):
        return getattr(self.root, key)

    def __getitem__(self, key:str):
        return self.root[key]

    def __setitem__(self, key:str, value):
        self.root[key] = value

    def __contains__(self, key:str) -> bool:
        return key in self.root


linkml_meta = LinkMLMeta({'default_prefix': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/schema.yaml#',
     'description': 'Combined source data schemas.',
     'id': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/schema.yaml#',
     'imports': ['./assemblies',
                 './organisms',
                 './outbreaks',
                 './workflow_categories',
                 './workflows'],
     'name': 'schema',
     'prefixes': {'linkml': {'prefix_prefix': 'linkml',
                             'prefix_reference': 'https://w3id.org/linkml/'}},
     'source_file': './catalog/schema/schema.yaml'} )

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
    OTHER = "OTHER"


class WorkflowParameterVariable(str, Enum):
    """
    Possible variables that can be inserted into workflow parameters.
    """
    ASSEMBLY_ID = "ASSEMBLY_ID"
    ASSEMBLY_FASTA_URL = "ASSEMBLY_FASTA_URL"
    GENE_MODEL_URL = "GENE_MODEL_URL"
    SANGER_READ_RUN = "SANGER_READ_RUN"


class WorkflowPloidy(str, Enum):
    """
    Possible ploidies supported by workflows.
    """
    ANY = "ANY"
    DIPLOID = "DIPLOID"
    HAPLOID = "HAPLOID"
    POLYPLOID = "POLYPLOID"



class Assemblies(ConfiguredBaseModel):
    """
    Object containing list of assemblies.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/assemblies.yaml#',
         'tree_root': True})

    assemblies: List[Assembly] = Field(default=..., description="""List of assemblies.""", json_schema_extra = { "linkml_meta": {'alias': 'assemblies', 'domain_of': ['Assemblies']} })


class Assembly(ConfiguredBaseModel):
    """
    An assembly.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/assemblies.yaml#'})

    accession: str = Field(default=..., description="""The assembly's accession.""", json_schema_extra = { "linkml_meta": {'alias': 'accession', 'domain_of': ['Assembly']} })


class Organisms(ConfiguredBaseModel):
    """
    Object containing list of organisms.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/organisms.yaml#',
         'tree_root': True})

    organisms: List[Organism] = Field(default=..., description="""List of organisms.""", json_schema_extra = { "linkml_meta": {'alias': 'organisms', 'domain_of': ['Organisms']} })


class Organism(ConfiguredBaseModel):
    """
    Info for an organism.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/organisms.yaml#'})

    taxonomy_id: int = Field(default=..., description="""The organism's NCBI taxonomy ID.""", json_schema_extra = { "linkml_meta": {'alias': 'taxonomy_id', 'domain_of': ['Organism', 'Outbreak', 'Workflow']} })
    ploidy: List[OrganismPloidy] = Field(default=..., description="""The ploidies that the organism may have.""", json_schema_extra = { "linkml_meta": {'alias': 'ploidy', 'domain_of': ['Organism', 'Workflow']} })


class Outbreaks(ConfiguredBaseModel):
    """
    Object containing list of outbreaks.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/outbreaks.yaml#',
         'tree_root': True})

    outbreaks: List[Outbreak] = Field(default=..., description="""List of outbreaks.""", json_schema_extra = { "linkml_meta": {'alias': 'outbreaks', 'domain_of': ['Outbreaks']} })


class Outbreak(ConfiguredBaseModel):
    """
    Info for an outbreak.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/outbreaks.yaml#'})

    taxonomy_id: int = Field(default=..., description="""The outbreak's NCBI taxonomy ID.""", json_schema_extra = { "linkml_meta": {'alias': 'taxonomy_id', 'domain_of': ['Organism', 'Outbreak', 'Workflow']} })
    priority: OutbreakPriority = Field(default=..., description="""The priority of the outbreak.""", json_schema_extra = { "linkml_meta": {'alias': 'priority', 'domain_of': ['Outbreak']} })
    resources: List[OutbreakResource] = Field(default=..., description="""The resources associated with the outbreak.""", json_schema_extra = { "linkml_meta": {'alias': 'resources', 'domain_of': ['Outbreak']} })
    description: MarkdownFileReference = Field(default=..., description="""The description of the outbreak.""", json_schema_extra = { "linkml_meta": {'alias': 'description', 'domain_of': ['Outbreak', 'WorkflowCategory']} })
    active: bool = Field(default=..., description="""Determines if outbreak should be included, as they presumably change over time.""", json_schema_extra = { "linkml_meta": {'alias': 'active', 'domain_of': ['Outbreak', 'Workflow']} })
    highlight_descendant_taxonomy_ids: Optional[List[int]] = Field(default=None, description="""Taxonomy IDs of child taxa that should be highlighted.""", json_schema_extra = { "linkml_meta": {'alias': 'highlight_descendant_taxonomy_ids', 'domain_of': ['Outbreak']} })


class OutbreakResource(ConfiguredBaseModel):
    """
    A resource associated with an outbreak.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/outbreaks.yaml#'})

    url: str = Field(default=..., description="""The URL of the resource.""", json_schema_extra = { "linkml_meta": {'alias': 'url', 'domain_of': ['OutbreakResource', 'WorkflowUrlSpec']} })
    title: str = Field(default=..., description="""The title of the resource.""", json_schema_extra = { "linkml_meta": {'alias': 'title', 'domain_of': ['OutbreakResource']} })
    type: OutbreakResourceType = Field(default=..., description="""The type of the resource.""", json_schema_extra = { "linkml_meta": {'alias': 'type', 'domain_of': ['OutbreakResource']} })


class MarkdownFileReference(ConfiguredBaseModel):
    """
    A reference to a markdown file
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/outbreaks.yaml#'})

    path: str = Field(default=..., description="""Path to the markdown file""", json_schema_extra = { "linkml_meta": {'alias': 'path', 'domain_of': ['MarkdownFileReference']} })

    @field_validator('path')
    def pattern_path(cls, v):
        pattern=re.compile(r".*\.md$")
        if isinstance(v,list):
            for element in v:
                if isinstance(v, str) and not pattern.match(element):
                    raise ValueError(f"Invalid path format: {element}")
        elif isinstance(v,str):
            if not pattern.match(v):
                raise ValueError(f"Invalid path format: {v}")
        return v


class WorkflowCategories(ConfiguredBaseModel):
    """
    Object containing list of workflow categories.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/workflow_categories.yaml#',
         'tree_root': True})

    workflow_categories: List[WorkflowCategory] = Field(default=..., description="""List of workflow categories.""", json_schema_extra = { "linkml_meta": {'alias': 'workflow_categories', 'domain_of': ['WorkflowCategories']} })


class WorkflowCategory(ConfiguredBaseModel):
    """
    Workflow category.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/workflow_categories.yaml#'})

    category: WorkflowCategoryId = Field(default=..., description="""The ID of the workflow category.""", json_schema_extra = { "linkml_meta": {'alias': 'category', 'domain_of': ['WorkflowCategory']} })
    name: str = Field(default=..., description="""The display name of the workflow category.""", json_schema_extra = { "linkml_meta": {'alias': 'name', 'domain_of': ['WorkflowCategory']} })
    description: str = Field(default=..., description="""The description of the workflow category.""", json_schema_extra = { "linkml_meta": {'alias': 'description', 'domain_of': ['Outbreak', 'WorkflowCategory']} })
    show_coming_soon: bool = Field(default=..., description="""Whether to show 'Coming Soon' for the workflow category when it is not available.""", json_schema_extra = { "linkml_meta": {'alias': 'show_coming_soon', 'domain_of': ['WorkflowCategory']} })


class Workflows(ConfiguredBaseModel):
    """
    Object containing list of workflows.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/workflows.yaml#',
         'tree_root': True})

    workflows: List[Workflow] = Field(default=..., description="""List of workflows.""", json_schema_extra = { "linkml_meta": {'alias': 'workflows', 'domain_of': ['Workflows']} })


class Workflow(ConfiguredBaseModel):
    """
    A workflow.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/workflows.yaml#'})

    trs_id: str = Field(default=..., description="""The workflow's TRS ID.""", json_schema_extra = { "linkml_meta": {'alias': 'trs_id', 'domain_of': ['Workflow']} })
    categories: List[WorkflowCategoryId] = Field(default=..., description="""The IDs of the categories the workflow belongs to.""", json_schema_extra = { "linkml_meta": {'alias': 'categories', 'domain_of': ['Workflow']} })
    workflow_name: str = Field(default=..., description="""The display name of the workflow.""", json_schema_extra = { "linkml_meta": {'alias': 'workflow_name', 'domain_of': ['Workflow']} })
    workflow_description: str = Field(default=..., description="""The description of the workflow.""", json_schema_extra = { "linkml_meta": {'alias': 'workflow_description', 'domain_of': ['Workflow']} })
    ploidy: WorkflowPloidy = Field(default=..., description="""The ploidy supported by the workflow.""", json_schema_extra = { "linkml_meta": {'alias': 'ploidy', 'domain_of': ['Organism', 'Workflow']} })
    taxonomy_id: Optional[int] = Field(default=None, description="""The NCBI ID of the taxon supported by the workflow.""", json_schema_extra = { "linkml_meta": {'alias': 'taxonomy_id', 'domain_of': ['Organism', 'Outbreak', 'Workflow']} })
    parameters: List[WorkflowParameter] = Field(default=..., description="""The parameters of the workflow.""", json_schema_extra = { "linkml_meta": {'alias': 'parameters', 'domain_of': ['Workflow']} })
    active: bool = Field(default=..., description="""Determines if workflow should be included.""", json_schema_extra = { "linkml_meta": {'alias': 'active', 'domain_of': ['Outbreak', 'Workflow']} })


class WorkflowParameter(ConfiguredBaseModel):
    """
    A parameter that is provided to a workflow; must include a source for the parameter's value in order to be provided.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/workflows.yaml#'})

    key: str = Field(default=..., description="""The key in which the parameter will be set.""", json_schema_extra = { "linkml_meta": {'alias': 'key', 'domain_of': ['WorkflowParameter']} })
    variable: Optional[WorkflowParameterVariable] = Field(default=None, description="""A variable to substitute in as the value of the parameter.""", json_schema_extra = { "linkml_meta": {'alias': 'variable', 'domain_of': ['WorkflowParameter']} })
    url_spec: Optional[WorkflowUrlSpec] = Field(default=None, description="""A direct URL specification for the parameter.""", json_schema_extra = { "linkml_meta": {'alias': 'url_spec', 'domain_of': ['WorkflowParameter']} })
    type_guide: Optional[Any] = Field(default=None, description="""Arbitrary data describing the type of the parameter, intended only as convenient reference for maintainers.""", json_schema_extra = { "linkml_meta": {'alias': 'type_guide', 'domain_of': ['WorkflowParameter']} })


class WorkflowUrlSpec(ConfiguredBaseModel):
    """
    A URL specification for a workflow parameter.
    """
    linkml_meta: ClassVar[LinkMLMeta] = LinkMLMeta({'from_schema': 'https://github.com/galaxyproject/brc-analytics/blob/main/catalog/schema/workflows.yaml#'})

    ext: str = Field(default=..., description="""The file extension of the URL.""", json_schema_extra = { "linkml_meta": {'alias': 'ext', 'domain_of': ['WorkflowUrlSpec']} })
    src: str = Field(default=..., description="""The source type, typically 'url'.""", json_schema_extra = { "linkml_meta": {'alias': 'src', 'domain_of': ['WorkflowUrlSpec']} })
    url: str = Field(default=..., description="""The URL to the resource.""", json_schema_extra = { "linkml_meta": {'alias': 'url', 'domain_of': ['OutbreakResource', 'WorkflowUrlSpec']} })


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
WorkflowParameter.model_rebuild()
WorkflowUrlSpec.model_rebuild()

