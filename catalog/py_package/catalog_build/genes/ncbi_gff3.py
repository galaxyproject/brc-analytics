"""Read an NCBI GFF3 (RefSeq or GenBank) into genes and their transcripts.

The rules, and the cases rejected until decided, are in gene-reading-spec.md
beside this file.
"""

import datetime
import re
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import unquote

GENE_TYPES = {"gene", "pseudogene"}

# Rows read with no parent besides genes: 3D7's. Any other top-level row
# rejects the file, so a transcript or CDS outside a gene can't be dropped.
OTHER_TOP_LEVEL_TYPES = {"region"}

# Rows read as a gene's transcripts: the types 3D7's genes have. Any other row
# straight under a gene rejects the file (spec: "Cases we reject").
TRANSCRIPT_TYPES = {"mRNA", "transcript", "ncRNA", "tRNA", "rRNA", "snRNA", "snoRNA"}

# `#!annotation-source Community Annotation GCF_000002765.6-RS_2026_09`
_ANNOTATION_SOURCE = re.compile(
    r"^(?P<provider>.*\S)\s+GC[AF]_\d+\.\d+-(?P<release_label>\S+)$"
)


@dataclass
class Header:
    # Every `#!` line, key to value as written, for the GTF check.
    lines: Dict[str, str] = field(default_factory=dict)
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
    # The `product` of the transcript row, and of its CDS rows (naming the
    # protein, the same on each), each as written; neither stands in for the
    # other.
    transcript_product: Optional[str] = None
    protein_accession: Optional[str] = None
    protein_product: Optional[str] = None
    # The submitter's ID (`gnl|ASM:GCA_000002765|mrna.PF3D7_0100500-RA`),
    # which NCBI's GTF names a transcript after when it has no transcript_id.
    # Read for the GTF check only; not stored.
    orig_transcript_id: Optional[str] = None


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
        if not pair:
            continue
        if "=" not in pair:
            raise ValueError(f"An attribute without a value: {pair}")
        key, value = pair.split("=", 1)
        if key in attributes:
            raise ValueError(f"An attribute given twice in one row: {key}")
        attributes[key] = [unquote(v) for v in value.split(",")]
    return attributes


def _first(attributes: Dict[str, List[str]], key: str) -> Optional[str]:
    values = attributes.get(key)
    return values[0] if values else None


# A CDS row's protein_id and product.
CdsPair = Tuple[Optional[str], Optional[str]]


def one_cds_pair(transcript: str, pairs: Set[CdsPair]) -> CdsPair:
    """The protein and product a transcript's CDS rows all name."""
    if len({protein for protein, _ in pairs}) > 1:
        raise ValueError(f"Transcript {transcript}'s CDS rows name different proteins")
    if len(pairs) > 1:
        raise ValueError(f"Transcript {transcript}'s CDS rows name different products")
    return next(iter(pairs))


def read_header_line(line: str, header: Header) -> None:
    """Read one `#!` line, as NCBI's GFF3 and GTF both write them, into header."""
    key, _, value = line[2:].partition(" ")
    value = value.strip()
    header.lines[key] = value
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
    # The attributes of each gene's first row, which its other rows must repeat.
    gene_attribute_text: Dict[str, str] = {}
    # The protein and product each transcript's CDS rows name.
    cds: Dict[str, Set[CdsPair]] = {}

    for raw in lines:
        line = raw.rstrip("\n")
        if line.startswith("#!"):
            read_header_line(line, header)
            continue
        if not line or line.startswith("#"):
            continue
        columns = line.split("\t")
        if len(columns) != 9:
            raise ValueError(f"A row without 9 columns: {line}")
        seq_name, _, row_type, start, end, _, strand, _, attribute_text = columns
        if strand not in ("+", "-"):
            raise ValueError(f"A row whose strand isn't + or -: {line}")
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
                gene_attribute_text[row_id] = attribute_text
            elif (gene.location.seq_name, gene.location.strand) != (
                location.seq_name,
                location.strand,
            ):
                raise ValueError(
                    f"Gene {row_id} has rows on more than one sequence or strand"
                )
            elif attribute_text != gene_attribute_text[row_id]:
                raise ValueError(f"Gene {row_id}'s rows give different attributes")
            else:
                # One gene written as several rows, one per piece (NCBI marks
                # it is_ordered): its location runs from the first piece to
                # the last.
                gene.location.start = min(gene.location.start, location.start)
                gene.location.end = max(gene.location.end, location.end)
            continue

        parents = attributes.get("Parent", [])
        if not parents and row_type not in OTHER_TOP_LEVEL_TYPES:
            raise ValueError(f"A {row_type} row has no gene parent: {line}")
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
                    orig_transcript_id=_first(attributes, "orig_transcript_id"),
                )
                gene.transcripts.append(transcripts[row_id])
            elif row_type == "CDS" and parent in transcripts:
                cds.setdefault(parent, set()).add(
                    (_first(attributes, "protein_id"), _first(attributes, "product"))
                )

    if not genes:
        raise ValueError("The GFF3 has no genes")
    for row_id, pairs in cds.items():
        transcript = transcripts[row_id]
        transcript.protein_accession, transcript.protein_product = one_cds_pair(
            row_id, pairs
        )
    for gene in genes.values():
        if not gene.transcripts:
            raise ValueError(f"Gene {gene.row_id} has no transcript rows")
        for transcript in gene.transcripts:
            inside = (
                transcript.location.seq_name == gene.location.seq_name
                and transcript.location.strand == gene.location.strand
                and gene.location.start <= transcript.location.start
                and transcript.location.end <= gene.location.end
            )
            if not inside:
                raise ValueError(
                    f"Transcript {transcript.row_id} is outside its gene {gene.row_id}"
                )
        # NCBI's convention: the Name is the symbol, else the locus tag.
        expected = "symbol" if gene.symbol else "locus tag"
        if gene.name is not None and gene.name != (gene.symbol or gene.locus_tag):
            raise ValueError(
                f"Gene {gene.row_id}'s Name {gene.name} isn't its {expected}"
            )

    return Annotation(header=header, genes=list(genes.values()))
