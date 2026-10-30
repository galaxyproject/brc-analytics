"""Response models for the gene API (/api/v1/genes). JSON fields are camelCase."""

from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class GeneSnapshotInfo(_CamelModel):
    """The gene snapshot an answer was read from."""

    build_id: str
    # The provenance database update it was built from; null for the
    # temporary snapshot, which is built straight from a GFF3.
    update: Optional[int]


class GeneLocation(_CamelModel):
    seq_name: str
    start: int
    end: int
    strand: str


class GeneOrganism(_CamelModel):
    name: str
    # The species' taxonomy ID; taxonomy_id is the assembly's own taxon, which
    # may be a strain, an isolate or the species itself.
    species_taxonomy_id: str
    taxonomy_id: str


class GeneTranscript(_CamelModel):
    # Null when the annotation gives none, as for tRNAs and pseudogene
    # transcripts in NCBI's files.
    transcript_id: Optional[str]
    # The transcript row's product, and its CDS's (naming the protein), each
    # as the annotation writes them.
    transcript_product: Optional[str]
    protein_accession: Optional[str]
    protein_product: Optional[str]
    location: GeneLocation


class GeneAlias(_CamelModel):
    value: str
    type: str
    current: bool
    publisher: str
    via: Optional[str]


class GeneProvenance(_CamelModel):
    annotation_set_version_id: str
    publisher: str
    provider: Optional[str]
    release_label: Optional[str]
    release_date: Optional[date]
    genes_as_of: Optional[date]
    retrieved_at: datetime


class Gene(_CamelModel):
    gene_uid: UUID
    # The GFF3's `locus_tag` and `Name`, as written; at least one is set. Two
    # genes can share either, so neither identifies a gene: gene_uid does.
    locus_tag: Optional[str]
    name: Optional[str]
    symbol: Optional[str]
    biotype: Optional[str]
    assembly_accession: str
    organism: GeneOrganism
    location: GeneLocation
    transcripts: List[GeneTranscript]
    aliases: List[GeneAlias]
    status: Literal["current", "not_in_latest"]
    provenance: GeneProvenance
    page_url: str


class GeneResponse(_CamelModel):
    snapshot: GeneSnapshotInfo
    gene: Gene
