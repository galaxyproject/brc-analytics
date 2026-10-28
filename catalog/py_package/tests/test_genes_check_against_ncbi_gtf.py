import gzip
import io
from contextlib import contextmanager
from pathlib import Path
from types import SimpleNamespace

import pytest
import urllib3
from catalog_build.genes import check_against_ncbi_gtf as check
from catalog_build.genes.check_against_ncbi_gtf import compare, main, read_ncbi_gtf
from catalog_build.genes.ncbi_gff3 import read_ncbi_gff3

CASES = Path(__file__).parent / "data" / "ncbi_cases"


def read_pair(name):
    with open(CASES / f"{name}.gff3", encoding="utf-8") as fh:
        genes = read_ncbi_gff3(fh).genes
    with open(CASES / f"{name}.gtf", encoding="utf-8") as fh:
        gtf_genes = read_ncbi_gtf(fh)
    return genes, gtf_genes


@pytest.mark.parametrize(
    "name",
    [
        "pfalciparum_3d7",
        "pfalciparum_3d7_products_differ",
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
        "proteins": ["PF3D7_0105400"],
        "transcript_products": ["PF3D7_0105400"],
        "protein_products": ["PF3D7_0105400"],
        "transcript_count": ["PF3D7_0105400"],
        "symbol": ["PF3D7_1133400"],
        "only in the GFF3": ["PF3D7_0100500"],
        "only in the GTF": ["PF3D7_0100500"],
    }


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
