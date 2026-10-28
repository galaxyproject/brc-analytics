from pathlib import Path

import pytest
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
        "products": ["PF3D7_0105400"],
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
