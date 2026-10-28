"""Read an NCBI GFF3 (RefSeq or GenBank) into genes and their transcripts.

The rules, and the cases rejected until decided, are in gene-reading-spec.md
beside this file.
"""

import datetime
import re
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Set
from urllib.parse import unquote

GENE_TYPES = {"gene", "pseudogene"}

# Rows read as a gene's transcripts: the types 3D7's genes have. Any other row
# straight under a gene rejects the file (spec: "Cases we reject").
TRANSCRIPT_TYPES = {"mRNA", "transcript", "ncRNA", "tRNA", "rRNA", "snRNA", "snoRNA"}

# `#!annotation-source Community Annotation GCF_000002765.6-RS_2026_09`
_ANNOTATION_SOURCE = re.compile(
    r"^(?P<provider>.*\S)\s+GC[AF]_\d+\.\d+-(?P<release_label>\S+)$"
)


@dataclass
class Header:
    genome_build_accession: Optional[str] = None
    provider: Optional[str] = None
    release_label: Optional[str] = None
    release_date: Optional[datetime.date] = None


@dataclass
class Location:
    seq_name: str
    start: int
    end: int
    strand: str


@dataclass
class Transcript:
    # The transcript row's GFF3 `ID`, and its `transcript_id`, which tRNA and
    # other RNA rows often don't have.
    row_id: str
    transcript_id: Optional[str]
    biotype: str
    location: Location
    # The `product` of the transcript row, and of its first CDS row (naming
    # the protein), each as written; neither stands in for the other.
    transcript_product: Optional[str] = None
    protein_accession: Optional[str] = None
    protein_product: Optional[str] = None


@dataclass
class Gene:
    # The gene row's GFF3 `ID`: unique in the file, and shared by the rows of
    # one gene written as several rows.
    row_id: str
    # The `locus_tag`, `Name` and `gene` attributes, as written. NCBI's `Name`
    # is the symbol when the gene has one, else the locus tag; two genes can
    # share a locus tag or a name.
    locus_tag: Optional[str]
    name: Optional[str]
    symbol: Optional[str]
    biotype: Optional[str]
    location: Location
    ncbi_gene_id: Optional[str]
    old_locus_tags: List[str]
    transcripts: List[Transcript] = field(default_factory=list)

    @property
    def label(self) -> str:
        """What the gene is called: its locus tag, else its name."""
        label = self.locus_tag or self.name
        assert label is not None  # _new_gene requires one of them
        return label


@dataclass
class Annotation:
    header: Header
    genes: List[Gene]


def _parse_attributes(text: str) -> Dict[str, List[str]]:
    # Split on the separators before decoding, so an encoded comma (%2C) in a
    # product stays part of its value.
    attributes: Dict[str, List[str]] = {}
    for pair in text.strip().split(";"):
        if "=" not in pair:
            continue
        key, value = pair.split("=", 1)
        attributes[key] = [unquote(v) for v in value.split(",")]
    return attributes


def _first(attributes: Dict[str, List[str]], key: str) -> Optional[str]:
    values = attributes.get(key)
    return values[0] if values else None


def _read_header_line(line: str, header: Header) -> None:
    key, _, value = line[2:].partition(" ")
    value = value.strip()
    if key == "genome-build-accession":
        header.genome_build_accession = value.rpartition(":")[2] or None
    elif key == "annotation-source":
        match = _ANNOTATION_SOURCE.match(value)
        header.provider = match.group("provider") if match else value or None
        header.release_label = match.group("release_label") if match else None
    elif key == "annotation-date":
        try:
            header.release_date = datetime.datetime.strptime(value, "%m/%d/%Y").date()
        except ValueError:
            header.release_date = None


def _new_gene(row_id: str, attributes: Dict[str, List[str]], location: Location):
    locus_tag = _first(attributes, "locus_tag")
    name = _first(attributes, "Name")
    if locus_tag is None and name is None:
        raise ValueError(f"Gene row {row_id} has no locus_tag or Name")
    ncbi_gene_id = next(
        (
            xref.partition(":")[2]
            for xref in attributes.get("Dbxref", [])
            if xref.startswith("GeneID:")
        ),
        None,
    )
    return Gene(
        row_id=row_id,
        locus_tag=locus_tag,
        name=name,
        symbol=_first(attributes, "gene"),
        biotype=_first(attributes, "gene_biotype"),
        location=location,
        ncbi_gene_id=ncbi_gene_id,
        # NCBI encodes the commas between old locus tags (`%2C`), so they
        # arrive as one decoded value.
        old_locus_tags=[
            tag
            for value in attributes.get("old_locus_tag", [])
            for tag in value.split(",")
        ],
    )


def read_ncbi_gff3(lines: Iterable[str]) -> Annotation:
    """Read an NCBI GFF3's lines into its genes, in file order."""
    header = Header()
    # Keyed by GFF3 row ID.
    genes: Dict[str, Gene] = {}
    transcripts: Dict[str, Transcript] = {}
    # Every row ID read so far, so a row before its parent is caught.
    row_ids: Set[str] = set()

    for raw in lines:
        line = raw.rstrip("\n")
        if line.startswith("#!"):
            _read_header_line(line, header)
            continue
        if not line or line.startswith("#"):
            continue
        columns = line.split("\t")
        if len(columns) != 9:
            continue
        seq_name, _, row_type, start, end, _, strand, _, attribute_text = columns
        attributes = _parse_attributes(attribute_text)
        row_id = _first(attributes, "ID")
        if row_id:
            row_ids.add(row_id)
        location = Location(seq_name, int(start), int(end), strand)

        if row_type in GENE_TYPES:
            if row_id is None:
                raise ValueError(f"A {row_type} row has no ID: {line}")
            gene = genes.get(row_id)
            if gene is None:
                genes[row_id] = _new_gene(row_id, attributes, location)
            elif (gene.location.seq_name, gene.location.strand) != (
                location.seq_name,
                location.strand,
            ):
                raise ValueError(
                    f"Gene {row_id} has rows on more than one sequence or strand"
                )
            else:
                # One gene written as several rows, one per piece (NCBI marks
                # it is_ordered): its location runs from the first piece to
                # the last.
                gene.location.start = min(gene.location.start, location.start)
                gene.location.end = max(gene.location.end, location.end)
            continue

        parents = attributes.get("Parent", [])
        for parent in parents:
            if parent not in row_ids:
                raise ValueError(f"A {row_type} row comes before its parent {parent}")
        if len(parents) > 1 and any(parent in genes for parent in parents):
            raise ValueError(f"A {row_type} row has more than one gene parent: {line}")
        for parent in parents:
            if parent in genes:
                gene = genes[parent]
                if row_type not in TRANSCRIPT_TYPES:
                    raise ValueError(
                        f"Gene {parent} has a {row_type} row straight under it"
                    )
                if row_id is None:
                    raise ValueError(f"A {row_type} row of {parent} has no ID")
                if row_id in transcripts:
                    raise ValueError(f"Transcript {row_id} is written as several rows")
                transcripts[row_id] = Transcript(
                    row_id=row_id,
                    transcript_id=_first(attributes, "transcript_id"),
                    biotype=row_type,
                    location=location,
                    transcript_product=_first(attributes, "product"),
                )
                gene.transcripts.append(transcripts[row_id])
            elif row_type == "CDS" and parent in transcripts:
                transcript = transcripts[parent]
                transcript.protein_accession = transcript.protein_accession or _first(
                    attributes, "protein_id"
                )
                transcript.protein_product = transcript.protein_product or _first(
                    attributes, "product"
                )

    for gene in genes.values():
        if not gene.transcripts:
            raise ValueError(f"Gene {gene.row_id} has no transcript rows")

    return Annotation(header=header, genes=list(genes.values()))
