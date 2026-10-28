"""Write a gene snapshot: one DuckDB file holding the tables the gene API reads.

    python -m catalog_build.genes.build_gene_snapshot \\
        --assembly GCF_000002765.6 \\
        --gff3 https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/002/765/GCF_000002765.6_GCA_000002765/GCF_000002765.6_GCA_000002765_genomic.gff.gz \\
        --out ../../backend/api/app/data/genes/genes-3d7.duckdb

(run from catalog/py_package).

The GFF3 is checked against NCBI's GTF of the same annotation (by default the
GTF beside it) with check_against_ncbi_gtf, and any difference rejects the
assembly: nothing is written and the old file stays.

A stand-in for the real build (#1904): it reads one NCBI GFF3 straight from
the publisher, not from the provenance database, so the file holds one
annotation set version, and the columns the provenance database will fill are
null. Two shortcuts follow from that:

  * The annotation set version is named from the file's sha256. The real
    build identifies a version by its genes (core hash and content hash), so a
    file rewritten with the same genes keeps its version; here the hashes are
    null, and a rewritten file would get a new name.
  * Gene UIDs are UUID5s of the assembly accession and the gene row's GFF3
    `ID`, so they are the same on every run, but only while NCBI keeps the
    gene's row ID. Real gene UIDs come from the provenance database.
"""

import argparse
import datetime
import gzip
import hashlib
import io
import json
import os
import re
import subprocess
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import duckdb
import pandas as pd
import requests

from .check_against_ncbi_gtf import compare, describe, gtf_next_to, read_ncbi_gtf
from .ncbi_gff3 import Annotation, read_ncbi_gff3

SCHEMA_VERSION = 1

GENE_UID_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "https://brc-analytics.org/genes")

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_CATALOG = REPO_ROOT / "catalog" / "output" / "assemblies.json"

PUBLISHERS = {
    "GCF": ("NCBI RefSeq", "ncbi-refseq"),
    "GCA": ("NCBI GenBank", "ncbi-genbank"),
}

# Accessions whose version is matched with or without its `.N`.
VERSIONED_ALIAS_TYPES = {"transcript_id", "protein_accession"}

SCHEMA = """
CREATE TABLE snapshot (
    build_id VARCHAR PRIMARY KEY,
    schema_version INTEGER NOT NULL,
    "update" INTEGER,
    built_at TIMESTAMP NOT NULL,
    gene_sources_commit VARCHAR,
    code_commit VARCHAR,
    check_report JSON
);

CREATE TABLE assembly (
    accession VARCHAR PRIMARY KEY,
    organism_name VARCHAR NOT NULL,
    taxonomy_id VARCHAR NOT NULL,
    species_taxonomy_id VARCHAR,
    is_ref BOOLEAN NOT NULL,
    ucsc_browser_url VARCHAR
);

CREATE TABLE annotation_set_version (
    asv_id VARCHAR PRIMARY KEY,
    assembly_accession VARCHAR NOT NULL REFERENCES assembly (accession),
    publisher VARCHAR NOT NULL,
    provider VARCHAR,
    release_label VARCHAR,
    release_date DATE,
    genes_as_of DATE,
    version INTEGER NOT NULL,
    core_hash VARCHAR,
    content_hash VARCHAR,
    publisher_file_sha256 VARCHAR NOT NULL,
    first_seen TIMESTAMP NOT NULL,
    latest BOOLEAN NOT NULL
);

CREATE TABLE annotation_file_version (
    sha256 VARCHAR PRIMARY KEY,
    md5 VARCHAR NOT NULL,
    sha256_uncompressed VARCHAR NOT NULL,
    md5_uncompressed VARCHAR NOT NULL,
    size BIGINT NOT NULL,
    url VARCHAR NOT NULL,
    retrieved_at TIMESTAMP NOT NULL,
    archive_key VARCHAR,
    asv_id VARCHAR NOT NULL REFERENCES annotation_set_version (asv_id)
);

CREATE TABLE gene (
    gene_uid UUID NOT NULL,
    asv_id VARCHAR NOT NULL REFERENCES annotation_set_version (asv_id),
    present BOOLEAN NOT NULL,
    latest BOOLEAN NOT NULL,
    assembly_accession VARCHAR NOT NULL REFERENCES assembly (accession),
    locus_tag VARCHAR,
    name VARCHAR,
    symbol VARCHAR,
    product VARCHAR,
    biotype VARCHAR,
    seq_name VARCHAR NOT NULL,
    start BIGINT NOT NULL,
    "end" BIGINT NOT NULL,
    strand VARCHAR NOT NULL,
    PRIMARY KEY (gene_uid, asv_id)
);

CREATE TABLE transcript (
    gene_uid UUID NOT NULL,
    asv_id VARCHAR NOT NULL,
    gff3_row_id VARCHAR NOT NULL,
    transcript_id VARCHAR,
    protein_accession VARCHAR,
    product VARCHAR,
    biotype VARCHAR,
    seq_name VARCHAR NOT NULL,
    start BIGINT NOT NULL,
    "end" BIGINT NOT NULL,
    strand VARCHAR NOT NULL,
    latest BOOLEAN NOT NULL,
    PRIMARY KEY (gene_uid, asv_id, gff3_row_id),
    FOREIGN KEY (gene_uid, asv_id) REFERENCES gene (gene_uid, asv_id)
);

CREATE TABLE alt_id (
    value VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    gene_uid UUID NOT NULL,
    asv_id VARCHAR NOT NULL,
    value_lower VARCHAR NOT NULL,
    value_unversioned VARCHAR NOT NULL,
    publisher VARCHAR NOT NULL,
    via VARCHAR,
    latest BOOLEAN NOT NULL,
    PRIMARY KEY (value, type, gene_uid, asv_id),
    FOREIGN KEY (gene_uid, asv_id) REFERENCES gene (gene_uid, asv_id)
);
"""


@dataclass
class FileVersion:
    path: Path
    url: str
    sha256: str
    md5: str
    sha256_uncompressed: str
    md5_uncompressed: str
    size: int
    retrieved_at: datetime.datetime


def gene_uid(assembly_accession: str, gff3_row_id: str) -> uuid.UUID:
    return uuid.uuid5(GENE_UID_NAMESPACE, f"{assembly_accession}:{gff3_row_id}")


def _utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(
        tzinfo=None, microsecond=0
    )


def _open(path: Path, uncompressed: bool = True) -> io.BufferedIOBase:
    """Open a file as bytes, through gzip when it's gzipped and `uncompressed`."""
    with open(path, "rb") as fh:
        gzipped = fh.read(2) == b"\x1f\x8b"
    return gzip.open(path, "rb") if gzipped and uncompressed else open(path, "rb")


def _digests(fh: io.BufferedIOBase) -> Tuple[str, str]:
    sha256, md5 = hashlib.sha256(), hashlib.md5()
    for chunk in iter(lambda: fh.read(1 << 20), b""):
        sha256.update(chunk)
        md5.update(chunk)
    return sha256.hexdigest(), md5.hexdigest()


def _hash_file(path: Path, url: str) -> FileVersion:
    with _open(path, uncompressed=False) as fh:
        sha256, md5 = _digests(fh)
    with _open(path) as fh:
        sha256_uncompressed, md5_uncompressed = _digests(fh)
    return FileVersion(
        path=path,
        url=url,
        sha256=sha256,
        md5=md5,
        sha256_uncompressed=sha256_uncompressed,
        md5_uncompressed=md5_uncompressed,
        size=path.stat().st_size,
        retrieved_at=_utc_now(),
    )


def _download(source: str, workdir: Path) -> Path:
    """Download the file at a URL into `workdir`, or take a local path as is."""
    if not re.match(r"^https?://", source):
        return Path(source)
    path = workdir / source.rsplit("/", 1)[-1]
    with requests.get(source, stream=True, timeout=120) as response:
        response.raise_for_status()
        with open(path, "wb") as fh:
            for chunk in response.iter_content(1 << 20):
                fh.write(chunk)
    return path


def fetch_gff3(source: str, workdir: Path) -> FileVersion:
    """Download the GFF3 at a URL, or take a local path as is, and hash it."""
    return _hash_file(_download(source, workdir), source)


def _not_none(value: Any) -> Optional[str]:
    # The catalog writes missing taxonomy levels as the string "None".
    return None if value in (None, "None") else str(value)


def assembly_row(catalog_path: Path, accession: str) -> Dict[str, Any]:
    assemblies = json.loads(catalog_path.read_text(encoding="utf-8"))
    record = next((a for a in assemblies if a.get("accession") == accession), None)
    if record is None:
        raise ValueError(f"{accession} is not in the catalog ({catalog_path})")
    organism_name = (
        _not_none(record.get("taxonomicLevelStrain"))
        or _not_none(record.get("taxonomicLevelIsolate"))
        or _not_none(record.get("taxonomicLevelSpecies"))
    )
    return {
        "accession": accession,
        "organism_name": organism_name,
        "taxonomy_id": str(record["ncbiTaxonomyId"]),
        "species_taxonomy_id": _not_none(record.get("speciesTaxonomyId")),
        "is_ref": record.get("isRef") == "Yes",
        "ucsc_browser_url": record.get("ucscBrowserUrl"),
    }


def _code_commit() -> Optional[str]:
    try:
        return subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None


def snapshot_rows(
    annotation: Annotation,
    accession: str,
    file_version: FileVersion,
    assembly: Dict[str, Any],
    build_id: str,
) -> Dict[str, List[Dict[str, Any]]]:
    """The rows of each table, keyed by table name."""
    publisher, publisher_slug = PUBLISHERS[accession[:3]]
    asv_id = f"{publisher_slug}-{accession}-{file_version.sha256[:8]}"
    rows: Dict[str, List[Dict[str, Any]]] = {
        "snapshot": [
            {
                "build_id": build_id,
                "schema_version": SCHEMA_VERSION,
                "update": None,
                "built_at": _utc_now(),
                "gene_sources_commit": None,
                "code_commit": _code_commit(),
                "check_report": None,
            }
        ],
        "assembly": [assembly],
        "annotation_set_version": [
            {
                "asv_id": asv_id,
                "assembly_accession": accession,
                "publisher": publisher,
                "provider": annotation.header.provider,
                "release_label": annotation.header.release_label,
                "release_date": annotation.header.release_date,
                "genes_as_of": None,
                "version": 1,
                "core_hash": None,
                "content_hash": None,
                "publisher_file_sha256": file_version.sha256,
                "first_seen": file_version.retrieved_at,
                "latest": True,
            }
        ],
        "annotation_file_version": [
            {
                "sha256": file_version.sha256,
                "md5": file_version.md5,
                "sha256_uncompressed": file_version.sha256_uncompressed,
                "md5_uncompressed": file_version.md5_uncompressed,
                "size": file_version.size,
                "url": file_version.url,
                "retrieved_at": file_version.retrieved_at,
                "archive_key": None,
                "asv_id": asv_id,
            }
        ],
        "gene": [],
        "transcript": [],
        "alt_id": [],
    }
    for gene in annotation.genes:
        uid = str(gene_uid(accession, gene.row_id))
        rows["gene"].append(
            {
                "gene_uid": uid,
                "asv_id": asv_id,
                "present": True,
                "latest": True,
                "assembly_accession": accession,
                "locus_tag": gene.locus_tag,
                "name": gene.name,
                "symbol": gene.symbol,
                "product": gene.product,
                "biotype": gene.biotype,
                "seq_name": gene.location.seq_name,
                "start": gene.location.start,
                "end": gene.location.end,
                "strand": gene.location.strand,
            }
        )
        aliases: List[Tuple[str, str]] = [
            (value, alias_type)
            for value, alias_type in [
                (gene.locus_tag, "locus_tag"),
                (gene.name, "name"),
                (gene.symbol, "symbol"),
            ]
            if value is not None
        ]
        if gene.ncbi_gene_id:
            aliases.append((gene.ncbi_gene_id, "ncbi_gene_id"))
        for transcript in gene.transcripts:
            rows["transcript"].append(
                {
                    "gene_uid": uid,
                    "asv_id": asv_id,
                    "gff3_row_id": transcript.row_id,
                    "transcript_id": transcript.transcript_id,
                    "protein_accession": transcript.protein_accession,
                    "product": transcript.product,
                    "biotype": transcript.biotype,
                    "seq_name": transcript.location.seq_name,
                    "start": transcript.location.start,
                    "end": transcript.location.end,
                    "strand": transcript.location.strand,
                    "latest": True,
                }
            )
            if transcript.transcript_id:
                aliases.append((transcript.transcript_id, "transcript_id"))
            if transcript.protein_accession:
                aliases.append((transcript.protein_accession, "protein_accession"))
        aliases.extend((tag, "old_locus_tag") for tag in gene.old_locus_tags)
        for value, alias_type in dict.fromkeys(aliases):
            value_lower = value.lower()
            rows["alt_id"].append(
                {
                    "value": value,
                    "type": alias_type,
                    "gene_uid": uid,
                    "asv_id": asv_id,
                    "value_lower": value_lower,
                    "value_unversioned": (
                        re.sub(r"\.\d+$", "", value_lower)
                        if alias_type in VERSIONED_ALIAS_TYPES
                        else value_lower
                    ),
                    "publisher": publisher,
                    "via": None,
                    "latest": True,
                }
            )
    return rows


def write_snapshot(rows: Dict[str, List[Dict[str, Any]]], out: Path) -> None:
    """Write the tables to `out`, replacing it only once every row is in.

    The tables declare their keys, so a duplicate key or a reference that
    doesn't resolve fails the insert and leaves `out` as it was.
    """
    out.parent.mkdir(parents=True, exist_ok=True)
    partial = out.with_name(out.name + ".partial")
    partial.unlink(missing_ok=True)
    con = duckdb.connect(str(partial))
    try:
        con.execute(SCHEMA)
        con.execute("BEGIN TRANSACTION")
        # In order, so each table's references exist before it's filled.
        for table, table_rows in rows.items():
            if not table_rows:
                continue
            con.register("frame", pd.DataFrame(table_rows))
            columns = ", ".join(f'"{c}"' for c in table_rows[0])
            # Sorted by gene UID, so a lookup by gene reads one row group.
            order = " ORDER BY gene_uid" if "gene_uid" in table_rows[0] else ""
            con.execute(
                f"INSERT INTO {table} ({columns}) SELECT {columns} FROM frame{order}"
            )
            con.unregister("frame")
        con.execute("COMMIT")
        con.execute("CHECKPOINT")
    except Exception:
        con.close()
        partial.unlink(missing_ok=True)
        raise
    con.close()
    os.replace(partial, out)


def build_gene_snapshot(
    accession: str,
    gff3: str,
    out: Path,
    catalog: Path = DEFAULT_CATALOG,
    gtf: Optional[str] = None,
) -> Dict[str, int]:
    """Build the snapshot for one assembly's NCBI GFF3, and count each table's rows."""
    assembly = assembly_row(catalog, accession)
    with tempfile.TemporaryDirectory() as workdir:
        file_version = fetch_gff3(gff3, Path(workdir))
        gtf_path = _download(gtf or gtf_next_to(gff3), Path(workdir))
        with _open(file_version.path) as fh:
            annotation = read_ncbi_gff3(line.decode("utf-8") for line in fh)
        with _open(gtf_path) as fh:
            gtf_genes = read_ncbi_gtf(line.decode("utf-8") for line in fh)
    stated = annotation.header.genome_build_accession
    if stated and stated != accession:
        raise ValueError(f"The GFF3 is for {stated}, not {accession}")
    differences = compare(annotation.genes, gtf_genes)
    if differences:
        raise ValueError(
            f"{accession} rejected: its GFF3 and NCBI's GTF disagree\n"
            + "\n".join(describe(differences))
        )
    build_id = f"temp-{accession}-{file_version.retrieved_at:%Y-%m-%dT%H%M%SZ}"
    rows = snapshot_rows(annotation, accession, file_version, assembly, build_id)
    write_snapshot(rows, out)
    return {table: len(table_rows) for table, table_rows in rows.items()}


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(
        description="Write a gene snapshot from one assembly's NCBI GFF3."
    )
    parser.add_argument("--assembly", required=True, help="Assembly accession")
    parser.add_argument("--gff3", required=True, help="NCBI GFF3 URL or local path")
    parser.add_argument(
        "--gtf", help="NCBI GTF URL or path to check against (default: next to --gff3)"
    )
    parser.add_argument("--out", required=True, type=Path, help="DuckDB file to write")
    parser.add_argument(
        "--catalog",
        type=Path,
        default=DEFAULT_CATALOG,
        help="The catalog's assemblies.json",
    )
    args = parser.parse_args(argv)
    counts = build_gene_snapshot(
        args.assembly, args.gff3, args.out, args.catalog, args.gtf
    )
    for table, count in counts.items():
        print(f"{table}: {count:,}")


if __name__ == "__main__":
    main()
