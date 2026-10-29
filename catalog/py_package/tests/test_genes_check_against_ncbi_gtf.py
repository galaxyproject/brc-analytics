import copy
import gzip
import io
from contextlib import contextmanager
from pathlib import Path
from types import SimpleNamespace

import pytest
import urllib3
from catalog_build.genes import check_against_ncbi_gtf as check
from catalog_build.genes.check_against_ncbi_gtf import (
    compare,
    compare_files,
    main,
    read_ncbi_gtf,
)
from catalog_build.genes.ncbi_gff3 import read_ncbi_gff3

CASES = Path(__file__).parent / "data" / "ncbi_cases"


def read_pair(name):
    with open(CASES / f"{name}.gff3", encoding="utf-8") as fh:
        genes = read_ncbi_gff3(fh).genes
    with open(CASES / f"{name}.gtf", encoding="utf-8") as fh:
        gtf_genes = read_ncbi_gtf(fh).genes
    return genes, gtf_genes


def read_files(name):
    with open(CASES / f"{name}.gff3", encoding="utf-8") as fh:
        annotation = read_ncbi_gff3(fh)
    with open(CASES / f"{name}.gtf", encoding="utf-8") as fh:
        return annotation, read_ncbi_gtf(fh)


@pytest.mark.parametrize(
    "name",
    [
        "pfalciparum_3d7",
        "pfalciparum_3d7_products_differ",
        "pfalciparum_3d7_three_transcripts",
        "pfalciparum_3d7_transcripts_differ",
        "aedes_genes_sharing_a_name",
    ],
)
def test_reader_agrees_with_ncbi_gtf(name):
    genes, gtf_genes = read_pair(name)
    assert len(genes) == len(gtf_genes)
    assert compare(genes, gtf_genes) == {}


def test_differences_are_reported():
    genes, gtf_genes = read_pair("pfalciparum_3d7")
    genes[3].symbol = "AMA-1"
    genes[1].transcripts.pop()
    genes[0].location.end += 1
    assert compare(genes, gtf_genes) == {
        "transcript_count": ["PF3D7_0105400"],
        "transcripts": ["PF3D7_0105400"],
        "symbol": ["PF3D7_1133400"],
        "only in the GFF3": ["PF3D7_0100500"],
        "only in the GTF": ["PF3D7_0100500"],
    }


def test_proteins_swapped_between_transcripts_are_a_difference():
    # PF3D7_0105400's two mRNAs, each given the other's protein.
    genes, gtf_genes = read_pair("pfalciparum_3d7")
    first, second = genes[1].transcripts
    first.protein_accession, second.protein_accession = (
        second.protein_accession,
        first.protein_accession,
    )
    assert compare(genes, gtf_genes) == {"transcripts": ["PF3D7_0105400"]}


def test_products_swapped_between_transcripts_without_ids_are_a_difference():
    # The Aedes tRNAs have no transcript IDs, so they're matched as a set.
    genes, gtf_genes = read_pair("aedes_genes_sharing_a_name")
    genes[0].transcripts[0].transcript_product = "tRNA-Xyz"
    assert compare(genes, gtf_genes) == {"transcripts": ["Trnaa-ggc"]}


def test_headers_naming_another_release_are_a_difference():
    annotation, gtf = read_files("pfalciparum_3d7")
    assert compare_files(annotation, gtf) == {}
    gtf.header["annotation-date"] = "09/19/2026"
    assert compare_files(annotation, gtf) == {"header": ["annotation-date"]}


def test_gtf_cds_rows_naming_different_proteins_fail():
    gtf = (CASES / "pfalciparum_3d7.gtf").read_text(encoding="utf-8")
    first_cds = next(line for line in gtf.splitlines() if "\tCDS\t" in line)
    changed = first_cds.replace('protein_id "', 'protein_id "WRONG')
    with pytest.raises(ValueError, match="different proteins or products"):
        read_ncbi_gtf([*gtf.splitlines(keepends=True), changed + "\n"])


def test_main_reports_a_gff3_the_reader_refuses(capsys):
    name = CASES / "giardia_gene_on_two_strands"
    assert main([f"{name}.gff3", "--gtf", f"{name}.gtf"]) == 2
    assert "reader refused the GFF3" in capsys.readouterr().out


def test_main_finds_the_gtf_next_to_the_gff3(capsys):
    assert main([str(CASES / "aedes_genes_sharing_a_name.gff3")]) == 0
    assert capsys.readouterr().out == "2 genes in the GFF3, 2 in the GTF\n"


@pytest.mark.parametrize("gzipped", [False, True])
def test_text_lines_reads_a_url_gzipped_or_not(monkeypatch, gzipped):
    # A urllib3 response, as requests streams it: it closes at its last byte.
    path = CASES / "aedes_genes_sharing_a_name.gtf"
    data = path.read_bytes()
    body = gzip.compress(data) if gzipped else data

    @contextmanager
    def get(url, **_):
        yield SimpleNamespace(
            raise_for_status=lambda: None,
            raw=urllib3.HTTPResponse(io.BytesIO(body), preload_content=False),
        )

    monkeypatch.setattr(check.requests, "get", get)
    lines = list(check.text_lines("https://example.org/x_genomic.gtf.gz"))
    assert "".join(lines) == data.decode("utf-8")


def test_gtf_next_to_needs_a_gff3_name():
    assert check.gtf_next_to("x_genomic.gff.gz") == "x_genomic.gtf.gz"
    with pytest.raises(ValueError, match="No GTF name"):
        check.gtf_next_to("x_genomic.gff.gz?download=1")


# Planted bugs: each breaks one gene's reading in one way, as a reader bug
# would. Each returns False when it can't apply to the gene.
def _swap(transcripts, field):
    pair = [t for t in transcripts if getattr(t, field)]
    if len(pair) < 2 or getattr(pair[0], field) == getattr(pair[1], field):
        return False
    a, b = getattr(pair[0], field), getattr(pair[1], field)
    setattr(pair[0], field, b)
    setattr(pair[1], field, a)
    return True


def _set(obj, field, value):
    if getattr(obj, field) == value:
        return False
    setattr(obj, field, value)
    return True


def _swap_products(transcripts):
    for t in transcripts:
        if t.transcript_product != t.protein_product:
            t.transcript_product, t.protein_product = (
                t.protein_product,
                t.transcript_product,
            )
            return True
    return False


PLANTED_BUGS = {
    "locus tag changed": lambda g: _set(g, "locus_tag", "WRONG_1"),
    "symbol changed": lambda g: _set(g, "symbol", "WRONG"),
    "biotype changed": lambda g: _set(g, "biotype", "misc_RNA"),
    "NCBI Gene ID changed": lambda g: _set(g, "ncbi_gene_id", "1"),
    "old locus tag added": lambda g: g.old_locus_tags.append("WRONG.1") or True,
    "location shifted": lambda g: _set(g.location, "end", g.location.end + 1),
    "transcript dropped": lambda g: bool(g.transcripts.pop()),
    "transcript duplicated": lambda g: g.transcripts.append(
        copy.deepcopy(g.transcripts[0])
    )
    or True,
    "proteins swapped": lambda g: _swap(g.transcripts, "protein_accession"),
    "transcript products swapped": lambda g: _swap(g.transcripts, "transcript_product"),
    "protein products swapped": lambda g: _swap(g.transcripts, "protein_product"),
    "a transcript's two products swapped": lambda g: _swap_products(g.transcripts),
    "protein changed": lambda g: _set(
        g.transcripts[0], "protein_accession", "XP_WRONG.1"
    ),
    "transcript product changed": lambda g: _set(
        g.transcripts[0], "transcript_product", "wrong"
    ),
    "transcript ID changed": lambda g: g.transcripts[0].transcript_id is not None
    and _set(g.transcripts[0], "transcript_id", "XM_WRONG.1"),
    "transcript ID dropped": lambda g: g.transcripts[0].transcript_id is not None
    and _set(g.transcripts[0], "transcript_id", None),
    "transcript biotype changed": lambda g: _set(
        g.transcripts[0], "biotype", "misc_RNA"
    ),
    "transcript location shifted": lambda g: _set(
        g.transcripts[0].location, "start", g.transcripts[0].location.start + 1
    ),
}

READABLE_CASES = [
    "pfalciparum_3d7",
    "pfalciparum_3d7_products_differ",
    "pfalciparum_3d7_three_transcripts",
    "pfalciparum_3d7_transcripts_differ",
    "aedes_genes_sharing_a_name",
]


@pytest.mark.parametrize("bug", PLANTED_BUGS)
def test_check_catches_each_planted_bug_in_every_gene(bug):
    # Every gene of every readable fixture, where the bug can apply.
    planted, missed = 0, []
    for name in READABLE_CASES:
        count = len(read_pair(name)[0])
        for i in range(count):
            genes, gtf_genes = read_pair(name)
            if not PLANTED_BUGS[bug](genes[i]):
                continue
            planted += 1
            if not compare(genes, gtf_genes):
                missed.append(f"{name}: {genes[i].label}")
    assert planted > 0
    assert missed == []
