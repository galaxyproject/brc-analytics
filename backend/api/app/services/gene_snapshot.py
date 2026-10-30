"""The gene snapshot pin, and the download of the snapshot it names.

A release serves the snapshot its pin names and no other. The pin is written
by catalog_build.genes.publish_gene_snapshot and released with the code; at
startup the app downloads the snapshot from the gene data store and checks it
against the pin's size and sha256 before opening it. The design is in
catalog/docs/gene-catalog/gene-snapshot-release-design.md.
"""

import hashlib
import logging
import shutil
import threading
from pathlib import Path
from typing import Tuple

import httpx
from pydantic import BaseModel, ConfigDict, Field

logger = logging.getLogger(__name__)

# Seconds to wait before each attempt after the first: five attempts in all,
# over about eight minutes. Then the app gives up until it is restarted.
RETRY_WAITS = (30, 60, 120, 240)

_CHUNK_BYTES = 1 << 20

# Per network operation, not for the whole download.
_TIMEOUT = httpx.Timeout(30.0)


class GeneSnapshotPin(BaseModel):
    """The snapshot a release serves."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    build_id: str = Field(pattern=r"^[A-Za-z0-9._-]+$")
    url: str = Field(pattern=r"^https://")
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    size: int = Field(gt=0)
    schema_version: int


class SnapshotRejected(Exception):
    """The download isn't the pinned snapshot; trying again won't change that."""


class SnapshotUnavailable(Exception):
    """Every attempt to download the pinned snapshot failed."""


class DownloadStopped(Exception):
    """The app is shutting down."""


def read_pin(path: Path) -> GeneSnapshotPin:
    return GeneSnapshotPin.model_validate_json(path.read_text())


def fetch_pinned_snapshot(
    pin_path: Path, directory: Path, stop: threading.Event, schema_version: int
) -> Tuple[Path, str]:
    """The pinned snapshot's path, once downloaded, and the build it must be."""
    pin = read_pin(pin_path)
    if pin.schema_version != schema_version:
        raise SnapshotRejected(
            f"the pin's schema version is {pin.schema_version}, not {schema_version}"
        )
    return download_pinned_snapshot(pin, directory, stop), pin.build_id


def download_pinned_snapshot(
    pin: GeneSnapshotPin, directory: Path, stop: threading.Event
) -> Path:
    """Download the pinned snapshot into directory and return its path.

    Network, disk and permission failures are retried; a file that isn't the
    pinned one is not.
    """
    attempts = len(RETRY_WAITS) + 1
    for attempt, wait in enumerate((0, *RETRY_WAITS), start=1):
        if stop.wait(wait):
            raise DownloadStopped
        try:
            return _download(pin, directory, stop)
        except (httpx.HTTPError, OSError) as exc:
            logger.warning(
                "Gene snapshot %s: download attempt %d of %d failed: %s",
                pin.build_id,
                attempt,
                attempts,
                exc,
            )
    raise SnapshotUnavailable(f"all {attempts} download attempts failed")


def _is_pinned_file(path: Path, pin: GeneSnapshotPin) -> bool:
    if not path.is_file() or path.stat().st_size != pin.size:
        return False
    with path.open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest() == pin.sha256


def _download(pin: GeneSnapshotPin, directory: Path, stop: threading.Event) -> Path:
    target = directory / f"{pin.build_id}.duckdb"
    # A container that restarts keeps its files: no need to fetch it again.
    if _is_pinned_file(target, pin):
        return target
    directory.mkdir(parents=True, exist_ok=True)
    free = shutil.disk_usage(directory).free
    if free < pin.size:
        raise OSError(
            f"{directory} has {free:,} bytes free; the snapshot is {pin.size:,}"
        )

    partial = target.with_name(target.name + ".partial")
    digest = hashlib.sha256()
    received = 0
    try:
        # The file first, so a directory that can't be written to fails
        # before any request is made.
        with (
            partial.open("wb") as out,
            httpx.stream("GET", pin.url, timeout=_TIMEOUT) as response,
        ):
            response.raise_for_status()
            for chunk in response.iter_bytes(_CHUNK_BYTES):
                if stop.is_set():
                    raise DownloadStopped
                received += len(chunk)
                if received > pin.size:
                    raise SnapshotRejected(
                        f"it is larger than the pinned {pin.size:,} bytes"
                    )
                digest.update(chunk)
                out.write(chunk)
        if received != pin.size:
            raise SnapshotRejected(
                f"it is {received:,} bytes, not the pinned {pin.size:,}"
            )
        if digest.hexdigest() != pin.sha256:
            raise SnapshotRejected(
                f"its sha256 is {digest.hexdigest()}, not the pinned {pin.sha256}"
            )
        partial.replace(target)
    finally:
        partial.unlink(missing_ok=True)
    return target
