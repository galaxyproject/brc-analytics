import json
import uuid
from pathlib import Path
from types import SimpleNamespace

import duckdb
import pytest
import requests
from catalog_build.genes import build_gene_snapshot as bgs

EXCERPT = Path(__file__).parent / "data" / "ncbi_cases" / "pfalciparum_3d7.gff3"

AMA1_UID = bgs.gene_uid("GCF_000002765.6", "gene-PF3D7_1133400")

# The 14 nuclear chromosomes UCSC's 3D7 browser has: not the mitochondrion
# (NC_037526.1) or the apicoplast (NC_036769.1).
UCSC_3D7 = [
    "NC_000521.4",
    "NC_004318.2",
    "NC_004325.2",
    "NC_004326.2",
    "NC_004327.3",
    "NC_004328.3",
    "NC_004329.3",
    "NC_004330.2",
    "NC_004331.3",
    "NC_037280.1",
    "NC_037281.1",
    "NC_037282.1",
    "NC_037283.1",
    "NC_037284.1",
]

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


@pytest.fixture(autouse=True)
def ucsc_reads(monkeypatch):
    """Stands in for UCSC's API, and records the accessions asked for."""
    reads = []

    def get(url, params, timeout):
        assert url == bgs.UCSC_CHROMOSOMES_URL
        reads.append(params["genome"])
        body = {"chromosomes": {name: 0 for name in UCSC_3D7}}
        return SimpleNamespace(raise_for_status=lambda: None, json=lambda: body)

    monkeypatch.setattr(bgs.requests, "get", get)
    return reads


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
        UCSC_3D7,
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
        "ucsc_sequence": 14,
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


def test_ucsc_sequences_come_from_ucsc(snapshot, ucsc_reads):
    con, _ = snapshot
    assert ucsc_reads == ["GCF_000002765.6"]
    assert con.execute(
        "SELECT assembly_accession, seq_name FROM ucsc_sequence ORDER BY seq_name"
    ).fetchall() == [("GCF_000002765.6", name) for name in UCSC_3D7]


def test_assembly_without_a_ucsc_browser_has_no_ucsc_sequences(tmp_path, ucsc_reads):
    catalog = tmp_path / "assemblies.json"
    catalog.write_text(json.dumps([{**CATALOG[0], "ucscBrowserUrl": None}]))
    out = tmp_path / "genes.duckdb"
    counts = bgs.build_gene_snapshot("GCF_000002765.6", str(EXCERPT), out, catalog)
    assert ucsc_reads == []
    assert counts["ucsc_sequence"] == 0


def test_failed_ucsc_read_fails_and_keeps_the_old_file(tmp_path, catalog, monkeypatch):
    out = tmp_path / "genes.duckdb"
    bgs.build_gene_snapshot("GCF_000002765.6", str(EXCERPT), out, catalog)
    before = out.read_bytes()

    def bad_request():
        raise requests.HTTPError("400 Client Error: Bad Request")

    # UCSC's answer for an assembly it has no browser for.
    monkeypatch.setattr(
        bgs.requests,
        "get",
        lambda *args, **kwargs: SimpleNamespace(raise_for_status=bad_request),
    )
    with pytest.raises(requests.HTTPError):
        bgs.build_gene_snapshot("GCF_000002765.6", str(EXCERPT), out, catalog)
    assert out.read_bytes() == before


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


def test_old_locus_tags_keep_their_versions(snapshot):
    # Only accessions lose their version: PF3D7_0105400.1 is a former locus
    # tag of its own, not a version of PF3D7_0105400.
    con, _ = snapshot
    assert con.execute(
        "SELECT value_unversioned FROM alt_id WHERE type = 'old_locus_tag'"
        " ORDER BY value"
    ).fetchall() == [("pf3d7_0105400.1",), ("pf3d7_0105400.2",)]


def test_gene_and_transcript_rows_are_stored_as_read(snapshot):
    con, _ = snapshot
    assert con.execute(
        'SELECT locus_tag, name, symbol, biotype, seq_name, start, "end", strand,'
        " present, latest FROM gene WHERE gene_uid = ?",
        [AMA1_UID],
    ).fetchone() == (
        "PF3D7_1133400",
        "AMA1",
        "AMA1",
        "protein_coding",
        "NC_037282.1",
        1292966,
        1296696,
        "+",
        True,
        True,
    )
    # A gene with no symbol: its Name is its locus tag.
    assert con.execute(
        "SELECT name, symbol FROM gene WHERE locus_tag = 'PF3D7_0105400'"
    ).fetchone() == ("PF3D7_0105400", None)
    # PF3D7_0105400's shorter transcript, whose span isn't the gene's.
    assert con.execute(
        "SELECT transcript_id, transcript_product, protein_accession,"
        ' protein_product, biotype, seq_name, start, "end", strand, latest'
        " FROM transcript WHERE gff3_row_id = 'rna-XM_024473365.1'"
    ).fetchone() == (
        "XM_024473365.1",
        "uncharacterized protein",
        "XP_024328984.1",
        "uncharacterized protein",
        "mRNA",
        "NC_004325.2",
        226681,
        227285,
        "-",
        True,
    )


def test_transcript_and_protein_products_are_stored_apart(tmp_path, catalog):
    out = tmp_path / "genes.duckdb"
    gff3 = EXCERPT.with_name("pfalciparum_3d7_products_differ.gff3")
    bgs.build_gene_snapshot("GCF_000002765.6", str(gff3), out, catalog)
    con = duckdb.connect(str(out), read_only=True)
    try:
        assert con.execute(
            "SELECT transcript_product, protein_product FROM transcript"
        ).fetchall() == [
            (
                "ATP-dependent DNA/RNA helicase PSH1",
                "putative ATP-dependent RNA helicase",
            )
        ]
    finally:
        con.close()


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
        "ucsc_sequence",
        "annotation_set_version",
        "annotation_file_version",
        "gene",
        "transcript",
        "alt_id",
    }
    assert foreign == {
        "ucsc_sequence",
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


def test_gff3_for_another_version_of_the_assembly_fails(tmp_path):
    catalog = tmp_path / "assemblies.json"
    catalog.write_text(json.dumps([{**CATALOG[0], "accession": "GCF_000002765.5"}]))
    with pytest.raises(ValueError, match="is for GCF_000002765.6"):
        bgs.build_gene_snapshot(
            "GCF_000002765.5", str(EXCERPT), tmp_path / "genes.duckdb", catalog
        )


@pytest.mark.parametrize(
    "header_line, changed",
    [
        (
            "#!genome-build-accession NCBI_Assembly:GCF_000002765.6",
            "#!genome-build-accession NCBI_Assembly:GCF_000002765.5",
        ),
        ("#!annotation-date 09/18/2026", ""),
    ],
)
def test_gtf_of_another_release_rejects_the_assembly(
    tmp_path, catalog, header_line, changed
):
    gtf = tmp_path / "other.gtf"
    gtf.write_text(
        EXCERPT.with_suffix(".gtf").read_text().replace(header_line, changed)
    )
    with pytest.raises(ValueError, match="rejected(.|\n)*header"):
        bgs.build_gene_snapshot(
            "GCF_000002765.6",
            str(EXCERPT),
            tmp_path / "genes.duckdb",
            catalog,
            gtf=str(gtf),
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


def test_gff3_that_does_not_give_its_release_fails(tmp_path, catalog):
    gff3 = tmp_path / "x_genomic.gff3"
    gff3.write_text(
        EXCERPT.read_text().replace(
            "#!annotation-source Community Annotation GCF_000002765.6-RS_2026_09",
            "#!annotation-source Community Annotation",
        )
    )
    with pytest.raises(ValueError, match="doesn't give its release"):
        bgs.build_gene_snapshot(
            "GCF_000002765.6", str(gff3), tmp_path / "genes.duckdb", catalog
        )
