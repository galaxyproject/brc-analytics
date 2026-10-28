import json
import uuid
from pathlib import Path

import duckdb
import pytest
from catalog_build.genes import build_gene_snapshot as bgs

EXCERPT = Path(__file__).parent / "data" / "ncbi_cases" / "pfalciparum_3d7.gff3"

AMA1_UID = bgs.gene_uid("GCF_000002765.6", "gene-PF3D7_1133400")

CATALOG = [
    {
        "accession": "GCF_000002765.6",
        "isRef": "Yes",
        "ncbiTaxonomyId": "36329",
        "speciesTaxonomyId": "5833",
        "taxonomicLevelIsolate": "Plasmodium falciparum 3D7",
        "taxonomicLevelSpecies": "Plasmodium falciparum",
        "taxonomicLevelStrain": "None",
        "ucscBrowserUrl": "https://genome.ucsc.edu/h/GCF_000002765.6",
    }
]


@pytest.fixture
def catalog(tmp_path):
    path = tmp_path / "assemblies.json"
    path.write_text(json.dumps(CATALOG))
    return path


def excerpt_rows(tmp_path, catalog):
    with open(EXCERPT, encoding="utf-8") as fh:
        annotation = bgs.read_ncbi_gff3(fh)
    return bgs.snapshot_rows(
        annotation,
        "GCF_000002765.6",
        bgs.fetch_gff3(str(EXCERPT), tmp_path),
        bgs.assembly_row(catalog, "GCF_000002765.6"),
        "test",
    )


@pytest.fixture
def snapshot(tmp_path, catalog):
    out = tmp_path / "genes.duckdb"
    counts = bgs.build_gene_snapshot("GCF_000002765.6", str(EXCERPT), out, catalog)
    con = duckdb.connect(str(out), read_only=True)
    yield con, counts
    con.close()


def test_gene_uids_are_stable():
    assert AMA1_UID == uuid.UUID("d9049485-ed74-5455-98c2-5dc13eef544a")


def test_counts(snapshot):
    _, counts = snapshot
    assert counts == {
        "snapshot": 1,
        "assembly": 1,
        "annotation_set_version": 1,
        "annotation_file_version": 1,
        "gene": 4,
        "transcript": 5,
        "alt_id": 21,
    }


def test_assembly_row_comes_from_the_catalog(snapshot):
    con, _ = snapshot
    assert con.execute("SELECT * FROM assembly").fetchall() == [
        (
            "GCF_000002765.6",
            "Plasmodium falciparum 3D7",
            "36329",
            "5833",
            True,
            "https://genome.ucsc.edu/h/GCF_000002765.6",
        )
    ]


def test_annotation_set_version_is_named_from_the_file(snapshot):
    con, _ = snapshot
    asv_id, publisher, provider, label, sha256 = con.execute(
        "SELECT asv_id, publisher, provider, release_label, publisher_file_sha256"
        " FROM annotation_set_version"
    ).fetchone()
    assert asv_id == f"ncbi-refseq-GCF_000002765.6-{sha256[:8]}"
    assert (publisher, provider, label) == (
        "NCBI RefSeq",
        "Community Annotation",
        "RS_2026_09",
    )
    file_sha256, url = con.execute(
        "SELECT sha256, url FROM annotation_file_version"
    ).fetchone()
    assert file_sha256 == sha256
    assert url == str(EXCERPT)


def test_aliases(snapshot):
    con, _ = snapshot
    rows = con.execute(
        "SELECT value, type, value_lower, value_unversioned FROM alt_id"
        " WHERE gene_uid = ? ORDER BY type, value",
        [AMA1_UID],
    ).fetchall()
    assert rows == [
        ("PF3D7_1133400", "locus_tag", "pf3d7_1133400", "pf3d7_1133400"),
        ("AMA1", "name", "ama1", "ama1"),
        ("810891", "ncbi_gene_id", "810891", "810891"),
        ("XP_001348015.1", "protein_accession", "xp_001348015.1", "xp_001348015"),
        ("AMA1", "symbol", "ama1", "ama1"),
        ("XM_001347979.2", "transcript_id", "xm_001347979.2", "xm_001347979"),
    ]


def test_transcripts_without_an_id_have_no_alias(snapshot):
    con, _ = snapshot
    assert con.execute(
        "SELECT gff3_row_id FROM transcript WHERE transcript_id IS NULL"
        " ORDER BY gff3_row_id"
    ).fetchall() == [("rna-PF3D7_0203500",), ("rna-mrna.PF3D7_0100500-RA",)]
    assert con.execute(
        "SELECT count(*) FROM alt_id WHERE type = 'transcript_id'"
    ).fetchone() == (3,)


def test_tables_declare_their_keys(snapshot):
    con, _ = snapshot
    constraints = con.execute(
        "SELECT table_name, constraint_type FROM duckdb_constraints()"
        " WHERE constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')"
    ).fetchall()
    primary = {table for table, kind in constraints if kind == "PRIMARY KEY"}
    foreign = {table for table, kind in constraints if kind == "FOREIGN KEY"}
    assert primary == {
        "snapshot",
        "assembly",
        "annotation_set_version",
        "annotation_file_version",
        "gene",
        "transcript",
        "alt_id",
    }
    assert foreign == {
        "annotation_set_version",
        "annotation_file_version",
        "gene",
        "transcript",
        "alt_id",
    }


def test_duplicate_key_fails_and_keeps_the_old_file(tmp_path, catalog):
    out = tmp_path / "genes.duckdb"
    bgs.build_gene_snapshot("GCF_000002765.6", str(EXCERPT), out, catalog)
    before = out.read_bytes()
    rows = excerpt_rows(tmp_path, catalog)
    rows["gene"].append(rows["gene"][0])
    with pytest.raises(duckdb.ConstraintException):
        bgs.write_snapshot(rows, out)
    assert out.read_bytes() == before
    assert not (tmp_path / "genes.duckdb.partial").exists()


def test_gff3_and_gtf_disagreeing_rejects_the_assembly(tmp_path, catalog):
    out = tmp_path / "genes.duckdb"
    bgs.build_gene_snapshot("GCF_000002765.6", str(EXCERPT), out, catalog)
    before = out.read_bytes()
    gtf = tmp_path / "other.gtf"
    gtf.write_text(
        EXCERPT.with_suffix(".gtf").read_text().replace('gene "AMA1"', 'gene "AMA-1"')
    )
    with pytest.raises(
        ValueError, match="rejected(.|\n)*symbol: 1 .e.g. PF3D7_1133400"
    ):
        bgs.build_gene_snapshot(
            "GCF_000002765.6", str(EXCERPT), out, catalog, gtf=str(gtf)
        )
    assert out.read_bytes() == before


def test_reference_that_does_not_resolve_fails(tmp_path, catalog):
    rows = excerpt_rows(tmp_path, catalog)
    rows["transcript"][0]["gene_uid"] = str(uuid.uuid4())
    with pytest.raises(duckdb.ConstraintException):
        bgs.write_snapshot(rows, tmp_path / "genes.duckdb")


def test_assembly_missing_from_the_catalog_fails(tmp_path, catalog):
    with pytest.raises(ValueError, match="not in the catalog"):
        bgs.build_gene_snapshot(
            "GCF_999999999.1", str(EXCERPT), tmp_path / "genes.duckdb", catalog
        )


def test_gff3_for_another_assembly_fails(tmp_path):
    catalog = tmp_path / "assemblies.json"
    catalog.write_text(json.dumps([{**CATALOG[0], "accession": "GCF_999999999.1"}]))
    with pytest.raises(ValueError, match="is for GCF_000002765.6"):
        bgs.build_gene_snapshot(
            "GCF_999999999.1", str(EXCERPT), tmp_path / "genes.duckdb", catalog
        )


def test_gff3_that_does_not_name_its_assembly_fails(tmp_path, catalog):
    gff3 = tmp_path / "x_genomic.gff3"
    gff3.write_text(
        "".join(
            line
            for line in EXCERPT.read_text().splitlines(keepends=True)
            if not line.startswith("#!genome-build-accession")
        )
    )
    with pytest.raises(ValueError, match="doesn't name its assembly"):
        bgs.build_gene_snapshot(
            "GCF_000002765.6", str(gff3), tmp_path / "genes.duckdb", catalog
        )
