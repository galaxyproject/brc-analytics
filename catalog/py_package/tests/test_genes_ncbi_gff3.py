import datetime
import re
from pathlib import Path

import pytest
from catalog_build.genes.ncbi_gff3 import Location, read_ncbi_gff3

# Each case is one or more genes' rows copied verbatim from an NCBI GFF3, with
# the same genes' rows from NCBI's GTF beside it (see
# test_genes_check_against_ncbi_gtf.py, which checks the two agree).
CASES = Path(__file__).parent / "data" / "ncbi_cases"


def read_case(name):
    with open(CASES / f"{name}.gff3", encoding="utf-8") as fh:
        return read_ncbi_gff3(fh)


def read_3d7():
    # P. falciparum 3D7 (GCF_000002765.6, RefSeq RS_2026_09): AMA1, a gene with
    # two mRNAs and old locus tags, a tRNA and a pseudogene.
    annotation = read_case("pfalciparum_3d7")
    return annotation, {gene.label: gene for gene in annotation.genes}


def test_header_gives_the_release():
    annotation, _ = read_3d7()
    assert annotation.header.genome_build_accession == "GCF_000002765.6"
    assert annotation.header.provider == "Community Annotation"
    assert annotation.header.release_label == "RS_2026_09"
    assert annotation.header.release_date == datetime.date(2026, 9, 18)


def test_genes_are_read_in_file_order():
    annotation, _ = read_3d7()
    assert [gene.label for gene in annotation.genes] == [
        "PF3D7_0100500",
        "PF3D7_0105400",
        "PF3D7_0203500",
        "PF3D7_1133400",
    ]


def test_protein_coding_gene():
    _, genes = read_3d7()
    ama1 = genes["PF3D7_1133400"]
    assert ama1.row_id == "gene-PF3D7_1133400"
    assert ama1.locus_tag == "PF3D7_1133400"
    assert ama1.name == "AMA1"
    assert ama1.symbol == "AMA1"
    assert ama1.ncbi_gene_id == "810891"
    assert ama1.biotype == "protein_coding"
    assert ama1.location == Location("NC_037282.1", 1292966, 1296696, "+")
    assert ama1.old_locus_tags == []
    [transcript] = ama1.transcripts
    assert transcript.row_id == "rna-XM_001347979.2"
    assert transcript.transcript_id == "XM_001347979.2"
    assert transcript.biotype == "mRNA"
    assert transcript.transcript_product == "apical membrane antigen 1"
    assert transcript.protein_accession == "XP_001348015.1"
    assert transcript.protein_product == "apical membrane antigen 1"


def test_gene_without_a_symbol_is_named_by_its_locus_tag():
    _, genes = read_3d7()
    gene = genes["PF3D7_0105400"]
    assert (gene.locus_tag, gene.name, gene.symbol) == (
        "PF3D7_0105400",
        "PF3D7_0105400",
        None,
    )


def test_old_locus_tags_are_split_on_encoded_commas():
    _, genes = read_3d7()
    assert genes["PF3D7_0105400"].old_locus_tags == [
        "PF3D7_0105400.1",
        "PF3D7_0105400.2",
    ]


def test_each_mrna_is_a_transcript_with_its_own_protein():
    _, genes = read_3d7()
    transcripts = genes["PF3D7_0105400"].transcripts
    assert [(t.transcript_id, t.protein_accession) for t in transcripts] == [
        ("XM_001350949.2", "XP_001350985.1"),
        ("XM_024473365.1", "XP_024328984.1"),
    ]


def test_rna_row_without_a_transcript_id_is_a_transcript_with_no_id():
    _, genes = read_3d7()
    trna = genes["PF3D7_0203500"]
    assert trna.biotype == "tRNA"
    [transcript] = trna.transcripts
    assert transcript.row_id == "rna-PF3D7_0203500"
    assert transcript.transcript_id is None
    assert transcript.biotype == "tRNA"
    assert transcript.protein_accession is None


def test_pseudogene_transcript_has_a_product_and_no_protein():
    _, genes = read_3d7()
    pseudogene = genes["PF3D7_0100500"]
    assert pseudogene.biotype == "transcribed_pseudogene"
    [transcript] = pseudogene.transcripts
    assert transcript.row_id == "rna-mrna.PF3D7_0100500-RA"
    assert transcript.transcript_id is None
    assert transcript.transcript_product == (
        "erythrocyte membrane protein 1 (PfEMP1), exon 1, pseudogene"
    )
    assert (transcript.protein_accession, transcript.protein_product) == (None, None)


def test_transcript_and_protein_products_are_read_separately():
    # 3D7's PSH1 (PF3D7_0103600): its mRNA and its CDS name different products.
    [gene] = read_case("pfalciparum_3d7_products_differ").genes
    [transcript] = gene.transcripts
    assert transcript.transcript_product == "ATP-dependent DNA/RNA helicase PSH1"
    assert transcript.protein_accession == "XP_024328879.1"
    assert transcript.protein_product == "putative ATP-dependent RNA helicase"


@pytest.mark.parametrize(
    "name, gene_row_id",
    [
        # P. ovale (GCA_900088545.1) writes POVWA2_000020 as six gene rows with
        # one ID, one per piece, with its CDS rows straight under the gene.
        ("povale_gene_in_several_rows", "gene-POVWA2_000020"),
        # Vitrella (GCA_001179505.1) puts Vbra_92's CDS rows straight under the
        # gene, beside an mRNA with no CDS.
        ("vitrella_cds_beside_an_mrna", "gene-Vbra_92"),
        # Vitrella's two Vbra_91 genes share a locus tag; the second has its
        # CDS rows straight under it.
        ("vitrella_genes_sharing_a_locus_tag", "gene-Vbra_91-2"),
    ],
)
def test_cds_rows_straight_under_a_gene_fail(name, gene_row_id):
    with pytest.raises(ValueError, match=f"{gene_row_id} has a CDS row straight"):
        read_case(name)


def test_genes_sharing_a_name_stay_separate():
    # Two of Aedes aegypti's tRNA genes (GCF_002204515.2): RefSeq's host and
    # vector files have no locus tags, and genes can share a name.
    genes = read_case("aedes_genes_sharing_a_name").genes
    assert [(g.row_id, g.locus_tag, g.label, g.ncbi_gene_id) for g in genes] == [
        ("gene-Trnaa-ggc", None, "Trnaa-ggc", "110674942"),
        ("gene-Trnaa-ggc-2", None, "Trnaa-ggc", "110674901"),
    ]
    assert [[t.row_id for t in g.transcripts] for g in genes] == [
        ["rna-Trnaa-ggc"],
        ["rna-Trnaa-ggc-2"],
    ]


def test_gene_on_two_strands_fails():
    # Giardia (GCF_000002435.2) writes a trans-spliced gene as gene rows on
    # both strands.
    with pytest.raises(ValueError, match="more than one sequence or strand"):
        read_case("giardia_gene_on_two_strands")


def test_gene_without_a_locus_tag_or_name_fails():
    # Made up: none of 262 sampled NCBI files has such a gene.
    row = "NC_1.1\tRefSeq\tgene\t1\t90\t.\t+\t.\tID=gene-1;gbkey=Gene"
    with pytest.raises(ValueError, match="gene-1 has no locus_tag or Name"):
        read_ncbi_gff3([row])


def test_the_specs_fixtures_are_the_fixtures():
    # Every fixture is a case in the spec, and every fixture the spec names
    # exists: the last column of its case tables (sections 3 and 4) names them.
    spec = (
        Path(__file__).parents[1] / "catalog_build" / "genes" / "gene-reading-spec.md"
    ).read_text(encoding="utf-8")
    cases = spec[spec.index("## 3. Cases we read") : spec.index("## 5. ")]
    named = {
        name
        for row in re.findall(r"^\|.*\|$", cases, re.MULTILINE)
        for name in re.findall(r"`([a-z0-9_]+)`", row.rstrip("|").rsplit("|", 1)[1])
    }
    assert named == {path.stem for path in CASES.glob("*.gff3")}


def test_transcript_with_two_gene_parents_fails():
    # Made up: two genes and one tRNA row under both.
    rows = [
        "NC_1.1\tRefSeq\tgene\t1\t90\t.\t+\t.\tID=gene-A;locus_tag=A",
        "NC_1.1\tRefSeq\tgene\t1\t90\t.\t+\t.\tID=gene-B;locus_tag=B",
        "NC_1.1\tRefSeq\ttRNA\t1\t90\t.\t+\t.\tID=rna-A;Parent=gene-A,gene-B",
    ]
    with pytest.raises(ValueError, match="more than one gene parent"):
        read_ncbi_gff3(rows)


def test_row_before_its_parent_fails():
    # Made up, from AMA1's rows in the 3D7 fixture: its CDS row moved above
    # its mRNA row.
    rows = [
        line
        for line in (CASES / "pfalciparum_3d7.gff3").read_text().splitlines()
        if "PF3D7_1133400" in line and "\texon\t" not in line
    ]
    gene, mrna, cds = rows
    with pytest.raises(ValueError, match="CDS row comes before its parent rna-XM"):
        read_ncbi_gff3([gene, cds, mrna])


def test_three_transcripts_each_with_its_own_protein():
    # 3D7's PF3D7_0613000: three mRNAs sharing one product, so only their
    # protein accessions tell them apart.
    [gene] = read_case("pfalciparum_3d7_three_transcripts").genes
    assert [(t.transcript_id, t.protein_accession) for t in gene.transcripts] == [
        ("XM_961024.3", "XP_966117.2"),
        ("XM_024473108.1", "XP_024329002.1"),
        ("XM_024473109.1", "XP_024329003.1"),
    ]
    assert {t.protein_product for t in gene.transcripts} == {"uncharacterized protein"}


# Made-up rows for the rejected cases no sampled file has, or that need only
# one row to show (spec section 4).
GENE_A = "NC_1.1\tRefSeq\tgene\t1\t90\t.\t+\t.\tID=gene-A;locus_tag=A"
MRNA_A = "NC_1.1\tRefSeq\tmRNA\t1\t90\t.\t+\t.\tID=rna-A;Parent=gene-A"


@pytest.mark.parametrize(
    "rows, reason",
    [
        ([GENE_A, "NC_1.1\tRefSeq\tgene\t1\t90"], "row without 9 columns"),
        (
            ["##gff-version 3", "NC_1.1\tRefSeq\tregion\t1\t90\t.\t+\t.\tID=r"],
            "no genes",
        ),
        (
            [GENE_A, "NC_1.1\tRefSeq\texon\t1\t90\t.\t+\t.\tID=e;Parent=gene-A"],
            "exon row straight under it",
        ),
        (
            [GENE_A, MRNA_A, MRNA_A.replace("\t1\t90", "\t100\t190")],
            "written as several rows",
        ),
        (["NC_1.1\tRefSeq\tgene\t1\t90\t.\t+\t.\tlocus_tag=A"], "gene row has no ID"),
        (
            [GENE_A, "NC_1.1\tRefSeq\tmRNA\t1\t90\t.\t+\t.\tParent=gene-A"],
            "mRNA row of gene-A has no ID",
        ),
    ],
)
def test_rejected_cases(rows, reason):
    with pytest.raises(ValueError, match=reason):
        read_ncbi_gff3(rows)
