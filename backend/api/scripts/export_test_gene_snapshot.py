"""Write the backend tests' gene snapshot: a few of 3D7's genes, as text.

    uv run python scripts/export_test_gene_snapshot.py ~/genes-3d7.duckdb

(run from backend/api), where the file is 3D7's snapshot as written by
catalog_build.genes.build_gene_snapshot. Keeps only GENES' rows and exports
the result with EXPORT DATABASE to tests/data/gene_snapshot, which conftest.py
imports when the tests start. Rerun it when the snapshot's tables change.
"""

import argparse
import shutil
import tempfile
from pathlib import Path

import duckdb

EXPORT_DIR = Path("tests/data/gene_snapshot")

# The genes kept, by locus tag, and what each is there to test.
GENES = {
    "PF3D7_1133400": "AMA1: a symbol; 'ama' and 'apical memb' find it first",
    "PF3D7_0105400": "no symbol; two transcripts and two old locus tags",
    "PF3D7_0203500": "a tRNA, with no product and no transcript ID",
    "PF3D7_0103600": "PSH1: transcript and protein products differ",
    "PF3D7_1218000": "'apical memb' finds it after AMA1",
    "PF3D7_1137200": "'apical' but not 'apical memb'",
    "PF3D7_1141300": "'apical' but not 'apical memb'",
    "PF3D7_0314300": "DER1-2: a symbol PF3D7_1032500 shares",
    "PF3D7_1032500": "Der1-2: a symbol PF3D7_0314300 shares",
    "PF3D7_1440300": "PBGS: its locus tag is PF3D7_1440200's old locus tag",
    "PF3D7_1440200": "SPP: its old locus tag is PF3D7_1440300's locus tag",
    # With AMA1, PF3D7_1137200 and PF3D7_1141300, more PF3D7_11 genes than a
    # small limit returns.
    "PF3D7_1130000": "PF3D7_11, for truncation",
    "PF3D7_1130100": "PF3D7_11, for truncation",
    "PF3D7_1130200": "PF3D7_11, for truncation",
    "PF3D7_1130300": "PF3D7_11, for truncation",
    "PF3D7_1130400": "PF3D7_11, for truncation",
}

# Tables holding rows per gene, children first, so a delete never leaves a
# reference that doesn't resolve.
GENE_TABLES = ("search_term", "alt_id", "transcript", "gene")


def export(snapshot: Path, out: Path) -> None:
    with tempfile.TemporaryDirectory() as workdir:
        path = Path(workdir) / "genes.duckdb"
        shutil.copy(snapshot, path)
        with duckdb.connect(str(path)) as con:
            con.execute(
                "CREATE TEMP TABLE kept AS SELECT gene_uid FROM gene"
                " WHERE list_contains(?, locus_tag)",
                [list(GENES)],
            )
            (count,) = con.execute("SELECT count(*) FROM kept").fetchone()
            if count != len(GENES):
                raise ValueError(f"{len(GENES) - count} of GENES aren't in {snapshot}")
            for table in GENE_TABLES:
                # Deleting keeps the remaining rows in their written order.
                con.execute(
                    f"DELETE FROM {table} WHERE gene_uid NOT IN"
                    " (SELECT gene_uid FROM kept)"
                )
            con.execute("DROP TABLE kept")
            if out.exists():
                shutil.rmtree(out)
            con.execute(f"EXPORT DATABASE '{out}'")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("snapshot", type=Path, help="3D7's gene snapshot")
    args = parser.parse_args()
    export(args.snapshot, EXPORT_DIR)


if __name__ == "__main__":
    main()
