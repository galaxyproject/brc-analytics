"""Read-only access to the gene snapshot, the DuckDB file the gene API reads.

The file is written by catalog_build.genes.build_gene_snapshot. On the servers
it is the snapshot the release's pin names, downloaded at startup (see
app/services/gene_snapshot.py); on a developer's machine it is a local file
named by GENE_SNAPSHOT_PATH. Each snapshot holds one annotation set version
per assembly for now, so every row is the latest.
"""

import atexit
import logging
import shutil
import tempfile
import threading
from datetime import timezone
from functools import lru_cache, partial
from pathlib import Path
from typing import Any, Callable, Dict, List, Literal, Optional, Tuple
from uuid import UUID

import duckdb

from app.models.genes import Gene, GeneSnapshotInfo
from app.services.gene_snapshot import DownloadStopped, fetch_pinned_snapshot

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

# A snapshot is read-only data from outside the app: it can't reach any file
# but its own, the network or an extension, and its settings can't be
# changed once open.
_DUCKDB_CONFIG = {
    "enable_external_access": False,
    "autoinstall_known_extensions": False,
    "autoload_known_extensions": False,
    "memory_limit": "1GB",
    "lock_configuration": True,
}


@lru_cache(maxsize=1)
def _duckdb_temp_dir() -> str:
    """An empty temp directory for snapshot connections, one per process.

    DuckDB lets a connection without external access use everything under its
    temp directory, so it gets its own rather than the system's. One per
    process, not per connection: DuckDB refuses a second connection to a file
    open with a different configuration. Removed when the process exits.
    """
    path = tempfile.mkdtemp(prefix="gene-snapshot-")
    atexit.register(shutil.rmtree, path, ignore_errors=True)
    return path


GeneDataStatus = Literal["loading", "ready", "unavailable"]
GeneDataSource = Literal["local", "pinned"]

# Finds the snapshot file to open: its path, and the build it must be (None
# for a local file). Stops early when the event is set.
FindSnapshot = Callable[[threading.Event], Tuple[Path, Optional[str]]]

_LOCAL_HINT = (
    "Build one with catalog_build.genes.build_gene_snapshot (see "
    "catalog/docs/gene-catalog/gene-snapshot-release-design.md)."
)

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
    """Read-only access to one gene snapshot file.

    Made with local(), which opens its file at once, or pinned(), which
    starts "loading" and downloads its snapshot in the background once
    start() is called. Gene requests are answered only when it is "ready".
    """

    def __init__(
        self, frontend_url: str, source: GeneDataSource, find_snapshot: FindSnapshot
    ):
        self.frontend_url = frontend_url.rstrip("/")
        self.source = source
        self.status: GeneDataStatus = "loading"
        self.snapshot: Optional[GeneSnapshotInfo] = None
        self._con: Optional[duckdb.DuckDBPyConnection] = None
        # Held only while a request's cursor is made from the shared
        # connection, as SRAMirrorService does; the queries run unlocked.
        self._cursor_lock = threading.Lock()
        self._find_snapshot = find_snapshot
        self._loader: Optional[threading.Thread] = None
        self._stop = threading.Event()

    @classmethod
    def local(cls, path: str, frontend_url: str) -> "GeneCatalogService":
        """Serve a file on this machine, for local development."""
        service = cls(frontend_url, "local", lambda _stop: (Path(path), None))
        service._load()
        return service

    @classmethod
    def pinned(
        cls, pin_path: Path, download_dir: Path, frontend_url: str
    ) -> "GeneCatalogService":
        """Serve the snapshot the release's pin names, once start() fetches it."""
        find = partial(
            fetch_pinned_snapshot,
            pin_path,
            download_dir,
            schema_version=SCHEMA_VERSION,
        )
        return cls(frontend_url, "pinned", find)

    def start(self) -> None:
        """Load the snapshot in the background, unless it already is loaded."""
        if self.status != "loading" or self._loader is not None:
            return
        self._loader = threading.Thread(
            target=self._load, name="gene-snapshot", daemon=True
        )
        self._loader.start()

    def _load(self) -> None:
        try:
            path, pinned_build_id = self._find_snapshot(self._stop)
            self._open(path, pinned_build_id)
        except DownloadStopped:
            return
        except Exception as exc:
            # Only the gene features go: the rest of the app keeps serving.
            self.status = "unavailable"
            hint = f" {_LOCAL_HINT}" if self.source == "local" else ""
            logger.error("Gene data is unavailable: %s.%s", exc, hint)

    def _open(self, path: Path, pinned_build_id: Optional[str] = None) -> None:
        """Open the snapshot at path and check it is one this service reads.

        A pinned snapshot must also be the build its pin names: the checksum
        proves the file is the one published, and this that the pin, which
        could be edited by hand, describes it.
        """
        if not path.is_file():
            raise FileNotFoundError(f"no file at {path}")
        con = duckdb.connect(
            str(path),
            read_only=True,
            config={**_DUCKDB_CONFIG, "temp_directory": _duckdb_temp_dir()},
        )
        try:
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
            if pinned_build_id is not None and build_id != pinned_build_id:
                raise duckdb.InvalidInputException(
                    f"it is build {build_id}, not the pinned {pinned_build_id}"
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
            snapshot = GeneSnapshotInfo(build_id=build_id, update=update)
        except BaseException:
            con.close()
            raise
        self._con = con
        self.snapshot = snapshot
        self.status = "ready"
        logger.info("Gene snapshot loaded (%s): build %s", self.source, build_id)

    def health(self) -> Dict[str, Optional[str]]:
        """The short status the health check reports; reasons go to the log."""
        return {
            "status": self.status,
            "source": self.source,
            "build_id": self.snapshot.build_id if self.snapshot else None,
        }

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
        self._stop.set()
        if self._con is not None:
            self._con.close()
            self._con = None
