"""Read-only access to the gene snapshot, the DuckDB file the gene API reads.

The file is written by catalog_build.genes.build_gene_snapshot. Until the
real snapshot exists it is the temporary 3D7 file checked in at
app/data/genes/genes-3d7.duckdb (#1904), which holds one annotation set
version, so every row is the latest.
"""

import logging
import tempfile
import threading
from datetime import timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

import duckdb

from app.models.genes import Gene, GeneSnapshotInfo

logger = logging.getLogger(__name__)

# The snapshot schema this service reads (build_gene_snapshot's
# SCHEMA_VERSION); a file of another version is reported unavailable.
SCHEMA_VERSION = 1

# The order aliases are listed in on a gene.
_ALIAS_TYPE_ORDER = (
    "symbol",
    "ncbi_gene_id",
    "transcript_id",
    "protein_accession",
    "old_locus_tag",
)

# Alias types that are a gene's former IDs rather than its current ones.
_FORMER_ALIAS_TYPES_SQL = "'old_locus_tag'"

# Alias types left out of a gene's aliases: they are fields of the gene itself.
_OWN_ALIAS_TYPES_SQL = "'locus_tag', 'name'"

# Each query returns rows shaped like the response models: column names are
# the models' fields and structs are their nested models.
_LOCATION = 'struct_pack(seq_name, start, "end", strand) AS location'

_GENE_SQL = """
SELECT g.locus_tag, g.name, g.symbol, g.biotype, g.assembly_accession,
       struct_pack(name := a.organism_name, taxonomy_id := a.taxonomy_id)
           AS organism,
       struct_pack(g.seq_name, g.start, g."end", g.strand) AS location,
       g.latest,
       struct_pack(
           annotation_set_version_id := v.asv_id, v.publisher, v.provider,
           v.release_label, v.release_date, v.genes_as_of, f.retrieved_at
       ) AS provenance
FROM gene g
JOIN assembly a ON a.accession = g.assembly_accession
JOIN annotation_set_version v ON v.asv_id = g.asv_id
JOIN annotation_file_version f ON f.sha256 = v.publisher_file_sha256
WHERE g.gene_uid = ? AND g.present
ORDER BY v.version DESC
LIMIT 1
"""

_TRANSCRIPTS_SQL = f"""
SELECT transcript_id, transcript_product, protein_accession, protein_product,
       {_LOCATION}
FROM transcript
WHERE gene_uid = ? AND asv_id = ?
ORDER BY start, transcript_id, gff3_row_id
"""

_ALIASES_SQL = f"""
SELECT value, type, type NOT IN ({_FORMER_ALIAS_TYPES_SQL}) AS current,
       publisher, via
FROM alt_id
WHERE gene_uid = ? AND asv_id = ? AND type NOT IN ({_OWN_ALIAS_TYPES_SQL})
ORDER BY list_position({list(_ALIAS_TYPE_ORDER)}, type) NULLS LAST, type, value
"""


def _records(cur: duckdb.DuckDBPyConnection) -> List[Dict[str, Any]]:
    columns = [d[0] for d in cur.description]
    return [dict(zip(columns, row, strict=True)) for row in cur.fetchall()]


class GeneCatalogService:
    """Read-only access to one gene snapshot file."""

    def __init__(self, snapshot_path: str, frontend_url: str):
        self.snapshot_path = snapshot_path
        self.frontend_url = frontend_url.rstrip("/")
        self._con: Optional[duckdb.DuckDBPyConnection] = None
        # Held only while a request's cursor is made from the shared
        # connection, as SRAMirrorService does; the queries run unlocked.
        self._cursor_lock = threading.Lock()
        self.snapshot: Optional[GeneSnapshotInfo] = None
        self._open()

    def _open(self) -> None:
        if not self.snapshot_path or not Path(self.snapshot_path).is_file():
            logger.warning(
                "Gene snapshot not found at %r -- gene API will report unavailable",
                self.snapshot_path,
            )
            return
        con: Optional[duckdb.DuckDBPyConnection] = None
        try:
            # Spill to the system temp directory, not next to the file, which
            # may be on a read-only mount (as with the SRA mirror).
            con = duckdb.connect(
                self.snapshot_path,
                read_only=True,
                config={"temp_directory": tempfile.gettempdir()},
            )
            row = con.execute(
                'SELECT build_id, "update", schema_version FROM snapshot'
            ).fetchone()
            if row is None:
                raise duckdb.InvalidInputException("its snapshot table is empty")
            build_id, update, schema_version = row
            if schema_version != SCHEMA_VERSION:
                raise duckdb.InvalidInputException(
                    f"its schema version is {schema_version}, not {SCHEMA_VERSION}"
                )
            # Run each query once, so a missing table or column fails here
            # rather than on every request.
            nil = UUID(int=0)
            for sql, params in (
                (_GENE_SQL, [nil]),
                (_TRANSCRIPTS_SQL, [nil, ""]),
                (_ALIASES_SQL, [nil, ""]),
            ):
                con.execute(sql, params).fetchall()
        except duckdb.Error as exc:
            logger.error(
                "Could not open gene snapshot at %s: %s", self.snapshot_path, exc
            )
            if con is not None:
                con.close()
            return
        self._con = con
        self.snapshot = GeneSnapshotInfo(build_id=build_id, update=update)
        logger.info("Gene snapshot loaded: build %s", build_id)

    def is_available(self) -> bool:
        return self.snapshot is not None

    def page_url(self, gene_uid: UUID) -> str:
        # The site serves gene pages at /data/genes/detail?uid= until
        # /data/genes/<gene_uid> is routed.
        return f"{self.frontend_url}/data/genes/detail?uid={gene_uid}"

    def get_gene(self, gene_uid: UUID) -> Optional[Gene]:
        """The gene with this UID, or None if the snapshot doesn't have it."""
        if self._con is None:
            raise RuntimeError("Gene snapshot is unavailable")
        # One cursor per call: FastAPI runs sync routes on a thread pool, and
        # a DuckDB connection isn't safe to share across threads. A cursor is
        # an independent connection onto the open database.
        with self._cursor_lock:
            cur = self._con.cursor()
        try:
            genes = _records(cur.execute(_GENE_SQL, [gene_uid]))
            if not genes:
                return None
            # Transcripts and aliases from the same annotation set version as
            # the gene row, which isn't the latest if the gene was dropped.
            asv_id = genes[0]["provenance"]["annotation_set_version_id"]
            transcripts = _records(cur.execute(_TRANSCRIPTS_SQL, [gene_uid, asv_id]))
            aliases = _records(cur.execute(_ALIASES_SQL, [gene_uid, asv_id]))
        finally:
            cur.close()

        gene = genes[0]
        # Stored as UTC without a zone.
        provenance = gene["provenance"]
        provenance["retrieved_at"] = provenance["retrieved_at"].replace(
            tzinfo=timezone.utc
        )
        return Gene.model_validate(
            {
                **gene,
                "gene_uid": gene_uid,
                "transcripts": transcripts,
                "aliases": aliases,
                # The row read is the gene's last present one; it is the latest
                # unless a newer annotation set version dropped the gene.
                "status": "current" if gene["latest"] else "not_in_latest",
                "page_url": self.page_url(gene_uid),
            }
        )

    def close(self) -> None:
        if self._con is not None:
            self._con.close()
            self._con = None
