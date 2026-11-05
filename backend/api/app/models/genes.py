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
    # The transcript's GFF3 row ID: unique within the gene, and set even when
    # transcript_id isn't.
    gff3_row_id: str
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
    # The assembly's UCSC Genome Browser address; null when UCSC has no browser
    # for it.
    ucsc_browser_url: Optional[str]
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


class GeneSearchMatch(_CamelModel):
    """What a search matched a gene on."""

    # A search_term type: an alias type, or transcript_product or
    # protein_product for a word of one of the gene's transcripts' products.
    type: str
    # The alias as written, or the whole product the word is in.
    value: str


class GeneSearchResult(_CamelModel):
    matched_on: GeneSearchMatch
    gene_uid: UUID
    locus_tag: Optional[str]
    name: Optional[str]
    symbol: Optional[str]
    assembly_accession: str
    organism: GeneOrganism
    page_url: str


class GeneSearchResponse(_CamelModel):
    snapshot: GeneSnapshotInfo
    # The query as searched: trimmed of surrounding whitespace.
    query: str
    results: List[GeneSearchResult]
    # Whether more genes matched than were returned.
    truncated: bool


class BionymClaim(_CamelModel):
    """One claim BioNym drew from a source: a language model's statement,
    the quote it rests on, and BioNym's confidence in it, from 0 to 1."""

    text: str
    quote: str
    confidence: float


class BionymSource(_CamelModel):
    """A paper or dataset BioNym drew claims from."""

    id: str
    kind: Literal["paper", "dataset"]
    title: str
    # Null unless the graph gives an https: link.
    url: Optional[str]
    claims: List[BionymClaim]


class BionymClaims(_CamelModel):
    """The claims in a gene's BioNym graph, grouped by source."""

    gene_uid: UUID
    # BioNym's input for the graph: the gene's locus tag.
    input: str
    # The latest retrieved_at among the graph's evidence; the graph's
    # metadata carries no run date.
    run_date: date
    sources: List[BionymSource]
