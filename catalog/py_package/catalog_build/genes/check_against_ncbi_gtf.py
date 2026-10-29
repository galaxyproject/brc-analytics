"""Check the GFF3 reader against NCBI's GTF of the same annotation.

    python -m catalog_build.genes.check_against_ncbi_gtf <GFF3 URL or path> \\
        [--gtf <GTF URL or path>]

NCBI publishes each annotation as a GFF3 and as a GTF, converting between them
with its own code. So where both files say something about a gene, reading the
GFF3 with ncbi_gff3 should give what the GTF says: the gene's location, locus
tag, symbol, NCBI Gene ID, biotype and old locus tags, and each of its
transcripts' ID, biotype, location, protein and products; and both files'
headers should name the same assembly and release. The GTF's gene IDs aren't
compared: it makes repeated gene names unique (`Trnaa-ggc_1`).

The GTF defaults to the GFF3's address with `.gff.gz` replaced by `.gtf.gz`.
Prints each kind of difference with a count and examples, and exits 1 if there
are any, or 2 if the GFF3 or the GTF can't be read.
"""

import argparse
import gzip
import io
import re
import sys
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Dict, Iterable, Iterator, List, Optional, Set, Tuple, Union

import requests

from .ncbi_gff3 import (
    Annotation,
    CdsPair,
    Gene,
    Header,
    Location,
    Transcript,
    one_cds_pair,
    one_value,
    read_header_line,
    read_ncbi_gff3,
)

# `gene_id "PF3D7_1133400"; db_xref "GeneID:810891";`
_GTF_ATTRIBUTE = re.compile(r'(\S+) "([^"]*)";')

# How many genes to name for each kind of difference.
EXAMPLES = 5

# The `#!` header lines that name the assembly and release, in both files.
RELEASE_HEADER_KEYS = (
    "genome-build",
    "genome-build-accession",
    "annotation-source",
    "annotation-date",
)


@dataclass
class GtfTranscript:
    transcript_id: str
    biotype: Optional[str] = None
    location: Optional[Location] = None
    transcript_product: Optional[str] = None
    protein_accession: Optional[str] = None
    protein_product: Optional[str] = None


@dataclass
class GtfGene:
    gene_id: str
    attributes: Dict[str, List[str]]
    location: Location
    transcripts: Dict[str, GtfTranscript] = field(default_factory=dict)


@dataclass
class GtfAnnotation:
    header: Header
    genes: List[GtfGene]


def _gtf_attributes(text: str) -> Dict[str, List[str]]:
    attributes: Dict[str, List[str]] = defaultdict(list)
    for key, value in _GTF_ATTRIBUTE.findall(text):
        attributes[key].append(value)
    return attributes


def read_ncbi_gtf(lines: Iterable[str]) -> GtfAnnotation:
    """Read an NCBI GTF's header, genes and transcripts, in file order."""
    header = Header()
    genes: Dict[str, GtfGene] = {}
    # The protein and product each transcript's CDS rows name.
    cds: Dict[Tuple[str, str], Set[CdsPair]] = defaultdict(set)
    for raw in lines:
        if raw.startswith("#!"):
            read_header_line(raw.rstrip("\n"), header)
            continue
        if raw.startswith("#") or not raw.strip():
            continue
        columns = raw.rstrip("\n").split("\t")
        if len(columns) != 9:
            raise ValueError(f"A GTF row without 9 columns: {raw.rstrip()}")
        seq_name, _, row_type, start, end, _, strand, _, text = columns
        attributes = _gtf_attributes(text)
        gene_id = one_value(attributes, "gene_id")
        if gene_id is None:
            raise ValueError(f"A GTF row without a gene_id: {raw.rstrip()}")
        location = Location(seq_name, int(start), int(end), strand)
        gene = genes.get(gene_id)
        if row_type == "gene":
            if gene is None:
                genes[gene_id] = GtfGene(gene_id, attributes, location)
            else:
                gene.location.start = min(gene.location.start, location.start)
                gene.location.end = max(gene.location.end, location.end)
            continue
        if gene is None:
            raise ValueError(f"GTF row for {gene_id} comes before its gene row")
        transcript_id = one_value(attributes, "transcript_id")
        if transcript_id is None:
            raise ValueError(f"A GTF row without a transcript_id: {raw.rstrip()}")
        transcript = gene.transcripts.setdefault(
            transcript_id, GtfTranscript(transcript_id)
        )
        product = one_value(attributes, "product")
        if row_type == "transcript":
            transcript.biotype = one_value(attributes, "transcript_biotype")
            transcript.location = location
            transcript.transcript_product = transcript.transcript_product or product
        elif row_type == "CDS":
            cds[(gene_id, transcript_id)].add(
                (one_value(attributes, "protein_id"), product)
            )
    for (gene_id, transcript_id), pairs in cds.items():
        transcript = genes[gene_id].transcripts[transcript_id]
        transcript.protein_accession, transcript.protein_product = one_cds_pair(
            transcript_id, pairs
        )
    return GtfAnnotation(header, list(genes.values()))


def _gff3_facts(gene: Gene) -> Dict[str, object]:
    return {
        "locus_tag": gene.locus_tag,
        "symbol": gene.symbol,
        "ncbi_gene_id": gene.ncbi_gene_id,
        "biotype": gene.biotype,
        "old_locus_tags": gene.old_locus_tags,
    }


def _gtf_facts(gene: GtfGene) -> Dict[str, object]:
    attributes = gene.attributes
    ncbi_gene_id = next(
        (
            xref.partition(":")[2]
            for xref in attributes.get("db_xref", [])
            if xref.startswith("GeneID:")
        ),
        None,
    )
    return {
        "locus_tag": one_value(attributes, "locus_tag"),
        "symbol": one_value(attributes, "gene"),
        "ncbi_gene_id": ncbi_gene_id,
        "biotype": one_value(attributes, "gene_biotype"),
        "old_locus_tags": [
            tag
            for value in attributes.get("old_locus_tag", [])
            for tag in value.split(",")
        ],
    }


def _key(location: Location) -> Tuple[str, int, int, str]:
    return (location.seq_name, location.start, location.end, location.strand)


# NCBI's GTF numbers the transcripts that have neither a transcript_id nor an
# orig_transcript_id in the GFF3.
_UNASSIGNED = re.compile(r"^unassigned_transcript_\d+$")

TranscriptRecord = Tuple[str, Optional[Tuple[str, int, int, str]], str, str, str]


def _record(t: Union[Transcript, GtfTranscript]) -> TranscriptRecord:
    """A transcript's biotype, location, protein and products, as one unit."""
    return (
        t.biotype or "",
        _key(t.location) if t.location else None,
        t.protein_accession or "",
        t.transcript_product or "",
        t.protein_product or "",
    )


def _gtf_name(transcript: Transcript) -> Optional[str]:
    """The ID NCBI's GTF gives a transcript, where the GFF3 implies one.

    Its transcript_id; else the last part of its orig_transcript_id
    (`gnl|ASM:GCA_000002765|mrna.PF3D7_0100500-RA` → `mrna.PF3D7_0100500-RA`);
    else none: the GTF numbers it as unassigned_transcript_N.
    """
    if transcript.transcript_id:
        return transcript.transcript_id
    if transcript.orig_transcript_id:
        return transcript.orig_transcript_id.rpartition("|")[2]
    return None


def _transcripts_agree(gene: Gene, gtf_gene: GtfGene) -> bool:
    """Whether each transcript has the same biotype, location, protein and products.

    A transcript is matched to the GTF transcript of the ID the GFF3 implies
    for it (_gtf_name). The ones with none are matched as a whole against the
    GTF's unassigned_transcript_N. Any GTF transcript left over is a
    difference, so a transcript ID the reader drops can't pass.
    """
    named: Dict[str, Transcript] = {}
    unnamed: List[TranscriptRecord] = []
    for transcript in gene.transcripts:
        name = _gtf_name(transcript)
        if name is None:
            unnamed.append(_record(transcript))
        elif name in named:
            return False
        else:
            named[name] = transcript
    for name, transcript in named.items():
        gtf_transcript = gtf_gene.transcripts.get(name)
        if gtf_transcript is None or _record(gtf_transcript) != _record(transcript):
            return False
    rest = [i for i in gtf_gene.transcripts if i not in named]
    if not all(_UNASSIGNED.match(i) for i in rest):
        return False
    return sorted(unnamed) == sorted(_record(gtf_gene.transcripts[i]) for i in rest)


def compare(genes: List[Gene], gtf_genes: List[GtfGene]) -> Dict[str, List[str]]:
    """Each kind of difference, with the genes that have it."""
    differences: Dict[str, List[str]] = defaultdict(list)
    # Genes are paired by location; genes at the same location pair in order.
    by_location: Dict[Tuple[str, int, int, str], List[GtfGene]] = defaultdict(list)
    for gtf_gene in gtf_genes:
        by_location[_key(gtf_gene.location)].append(gtf_gene)
    for gene in genes:
        candidates = by_location.get(_key(gene.location))
        if not candidates:
            differences["only in the GFF3"].append(gene.label)
            continue
        gtf_gene = candidates.pop(0)
        ours, theirs = _gff3_facts(gene), _gtf_facts(gtf_gene)
        differences_here = [fact for fact in ours if ours[fact] != theirs[fact]]
        if not _transcripts_agree(gene, gtf_gene):
            differences_here.append("transcripts")
        for fact in differences_here:
            differences[fact].append(gene.label)
    unpaired = [g.gene_id for remaining in by_location.values() for g in remaining]
    if unpaired:
        differences["only in the GTF"] = unpaired
    return dict(differences)


def compare_files(annotation: Annotation, gtf: GtfAnnotation) -> Dict[str, List[str]]:
    """compare()'s differences, and any header line naming the release that differs."""
    differences = compare(annotation.genes, gtf.genes)
    header = [
        key
        for key in RELEASE_HEADER_KEYS
        if annotation.header.lines.get(key) != gtf.header.lines.get(key)
    ]
    if header:
        differences["header"] = header
    return differences


def describe(differences: Dict[str, List[str]]) -> List[str]:
    """One line per kind of difference: its count and some of its genes."""
    return [
        f"{kind}: {len(labels)} (e.g. {', '.join(labels[:EXAMPLES])})"
        for kind, labels in sorted(differences.items())
    ]


def gtf_next_to(gff3: str) -> str:
    """Where NCBI puts the GTF beside a GFF3: `_genomic.gff.gz` → `_genomic.gtf.gz`."""
    gtf = re.sub(r"\.gff3?(\.gz)?$", r".gtf\1", gff3)
    if gtf == gff3:
        raise ValueError(f"No GTF name for {gff3}: give the GTF's address")
    return gtf


def is_url(source: str) -> bool:
    return re.match(r"^https?://", source) is not None


def _gunzipped(fh: io.BufferedReader) -> io.BufferedIOBase:
    if fh.peek(2)[:2] == b"\x1f\x8b":
        return gzip.GzipFile(fileobj=fh)
    return fh


@contextmanager
def open_source(source: str) -> Iterator[io.BufferedIOBase]:
    """A file at a URL or path as bytes, gunzipped if its first bytes are gzip's."""
    if is_url(source):
        with requests.get(source, stream=True, timeout=120) as response:
            response.raise_for_status()
            # urllib3 closes the body at its last byte, but gzip reads once more.
            response.raw.auto_close = False
            yield _gunzipped(io.BufferedReader(response.raw))
    else:
        with open(source, "rb") as fh:
            yield _gunzipped(fh)


def text_lines(source: str) -> Iterator[str]:
    """The lines of a file at a URL or path, gunzipped if it's gzip."""
    with open_source(source) as stream:
        for line in stream:
            yield line.decode("utf-8")


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Check the GFF3 reader against NCBI's GTF of the same annotation."
    )
    parser.add_argument("gff3", help="NCBI GFF3 URL or path")
    parser.add_argument(
        "--gtf", help="NCBI GTF URL or path (default: next to the GFF3)"
    )
    args = parser.parse_args(argv)
    gtf = args.gtf or gtf_next_to(args.gff3)
    try:
        annotation = read_ncbi_gff3(text_lines(args.gff3))
    except ValueError as exc:
        print(f"reader refused the GFF3: {exc}")
        return 2
    try:
        gtf_annotation = read_ncbi_gtf(text_lines(gtf))
    except ValueError as exc:
        print(f"reader refused the GTF: {exc}")
        return 2
    differences = compare_files(annotation, gtf_annotation)
    print(
        f"{len(annotation.genes)} genes in the GFF3, "
        f"{len(gtf_annotation.genes)} in the GTF"
    )
    for line in describe(differences):
        print(line)
    return 1 if differences else 0


if __name__ == "__main__":
    sys.exit(main())
