"""Tests for serving the pinned gene snapshot: the download, its checks and
retries, and that gene data failing turns off only the gene features."""

import hashlib
import json
import os
import shutil
from collections import namedtuple

import duckdb
import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import GENE_SNAPSHOT_PIN_PATH
from app.core.dependencies import get_gene_catalog_service
from app.services import gene_snapshot
from app.services.gene_catalog import SCHEMA_VERSION, GeneCatalogService
from app.services.gene_snapshot import read_pin
from tests.test_genes_api import make_client

AMA1 = "d9049485-ed74-5455-98c2-5dc13eef544a"
URL = "https://genes.test/snapshots/genes.duckdb"


@pytest.fixture
def store(monkeypatch):
    """A stand-in gene data store: answers with the queued responses in turn,
    then with the last one, and records the URLs it was asked for."""
    responses = []
    requests = []

    def handler(request):
        requests.append(str(request.url))
        answer = responses[min(len(requests), len(responses)) - 1]
        if isinstance(answer, Exception):
            raise answer
        return answer

    client = httpx.Client(transport=httpx.MockTransport(handler))
    monkeypatch.setattr(httpx, "stream", client.stream)
    monkeypatch.setattr(gene_snapshot, "RETRY_WAITS", (0, 0, 0, 0))
    Store = namedtuple("Store", "responses requests")
    yield Store(responses, requests)
    client.close()


@pytest.fixture
def snapshot_bytes(gene_snapshot_path):
    return gene_snapshot_path.read_bytes()


def write_pin(path, content, **changes):
    pin = {
        "build_id": "temp-GCF_000002765.6-2026-10-28T212348Z",
        "url": URL,
        "sha256": hashlib.sha256(content).hexdigest(),
        "size": len(content),
        "schema_version": SCHEMA_VERSION,
        **changes,
    }
    path.write_text(json.dumps(pin))
    return path


def join_loader(service, timeout=10):
    assert service._loader is not None
    service._loader.join(timeout=timeout)
    return service._loader


def load(tmp_path, pin_path):
    """A pinned service, loaded synchronously as start()'s thread would."""
    service = GeneCatalogService.pinned(pin_path, tmp_path / "genes", "")
    service._load()
    return service


def test_pinned_snapshot_is_downloaded_and_served(tmp_path, store, snapshot_bytes):
    store.responses.append(httpx.Response(200, content=snapshot_bytes))
    pin_path = write_pin(tmp_path / "pin.json", snapshot_bytes)
    service = GeneCatalogService.pinned(pin_path, tmp_path / "genes", "")
    assert service.health()["status"] == "loading"
    assert make_client(service).get(f"/api/v1/genes/{AMA1}").status_code == 503

    service.start()
    join_loader(service)

    assert service.health() == {
        "status": "ready",
        "source": "pinned",
        "build_id": "temp-GCF_000002765.6-2026-10-28T212348Z",
    }
    assert store.requests == [URL]
    assert os.listdir(tmp_path / "genes") == [
        "temp-GCF_000002765.6-2026-10-28T212348Z.duckdb"
    ]
    response = make_client(service).get(f"/api/v1/genes/{AMA1}")
    assert response.status_code == 200
    assert response.json()["gene"]["locusTag"] == "PF3D7_1133400"
    service.close()


@pytest.mark.parametrize(
    "changes",
    [
        {"sha256": "0" * 64},
        {"size": 1000},
    ],
    ids=["wrong checksum", "larger than pinned"],
)
def test_a_file_that_is_not_the_pinned_one_is_refused(
    tmp_path, store, snapshot_bytes, changes
):
    store.responses.append(httpx.Response(200, content=snapshot_bytes))
    service = load(
        tmp_path, write_pin(tmp_path / "pin.json", snapshot_bytes, **changes)
    )
    assert service.status == "unavailable"
    # Not retried: the store's copy won't change. Nothing is left behind.
    assert len(store.requests) == 1
    assert os.listdir(tmp_path / "genes") == []


def test_an_oversized_download_is_stopped_early(tmp_path, store, snapshot_bytes):
    # The store sends far more than the pin's size: reading stops just past
    # it rather than filling the disk.
    sent = []

    def endless():
        while len(sent) < 1000:
            sent.append(1)
            yield b"x" * len(snapshot_bytes)

    store.responses.append(httpx.Response(200, content=endless()))
    service = load(tmp_path, write_pin(tmp_path / "pin.json", snapshot_bytes))
    assert service.status == "unavailable"
    assert len(sent) <= 2


def test_a_failed_attempt_is_retried(tmp_path, store, snapshot_bytes):
    store.responses.extend(
        [httpx.ConnectError("unreachable"), httpx.Response(200, content=snapshot_bytes)]
    )
    service = load(tmp_path, write_pin(tmp_path / "pin.json", snapshot_bytes))
    assert service.status == "ready"
    assert len(store.requests) == 2


def test_the_app_gives_up_after_five_attempts(tmp_path, store, snapshot_bytes):
    store.responses.append(httpx.Response(403))
    service = load(tmp_path, write_pin(tmp_path / "pin.json", snapshot_bytes))
    assert service.health() == {
        "status": "unavailable",
        "source": "pinned",
        "build_id": None,
    }
    assert len(store.requests) == 5
    response = make_client(service).get(f"/api/v1/genes/{AMA1}")
    assert response.status_code == 503


def test_a_pin_that_names_another_build_is_refused(
    tmp_path, store, snapshot_bytes, caplog
):
    # The checksum matches, so the file is the published one, but the pin,
    # edited by hand, names a different build.
    store.responses.append(httpx.Response(200, content=snapshot_bytes))
    pin_path = write_pin(tmp_path / "pin.json", snapshot_bytes, build_id="other")
    service = load(tmp_path, pin_path)
    assert service.health() == {
        "status": "unavailable",
        "source": "pinned",
        "build_id": None,
    }
    assert "not the pinned other" in caplog.text


def test_a_pin_that_misstates_the_schema_version_is_refused(
    tmp_path, store, gene_snapshot_path, caplog
):
    # The pin says this release's schema version; the file it names is
    # another.
    path = tmp_path / "v2.duckdb"
    shutil.copy(gene_snapshot_path, path)
    con = duckdb.connect(str(path))
    con.execute(f"UPDATE snapshot SET schema_version = {SCHEMA_VERSION + 1}")
    con.close()
    content = path.read_bytes()
    store.responses.append(httpx.Response(200, content=content))
    service = load(tmp_path, write_pin(tmp_path / "pin.json", content))
    assert service.status == "unavailable"
    assert len(store.requests) == 1
    assert f"its schema version is {SCHEMA_VERSION + 1}" in caplog.text


@pytest.mark.parametrize(
    "changes",
    [
        {"url": "http://genes.test/snapshots/genes.duckdb"},
        {"sha256": "ABC"},
        {"sha256": "A" * 64},
        {"size": 0},
        {"build_id": "../genes"},
        {"build_id": None},
        {"extra": "field"},
    ],
    ids=[
        "not https",
        "short sha256",
        "uppercase sha256",
        "empty",
        "build ID that is a path",
        "no build ID",
        "unknown field",
    ],
)
def test_a_malformed_pin_is_not_downloaded(tmp_path, store, snapshot_bytes, changes):
    pin_path = write_pin(tmp_path / "pin.json", snapshot_bytes, **changes)
    with pytest.raises(ValidationError):
        read_pin(pin_path)
    assert load(tmp_path, pin_path).status == "unavailable"
    assert store.requests == []


def test_a_pin_of_another_schema_version_is_not_downloaded(
    tmp_path, store, snapshot_bytes
):
    pin_path = write_pin(
        tmp_path / "pin.json", snapshot_bytes, schema_version=SCHEMA_VERSION + 1
    )
    assert load(tmp_path, pin_path).status == "unavailable"
    assert store.requests == []


def test_a_missing_pin_is_unavailable(tmp_path, store):
    assert load(tmp_path, tmp_path / "missing.json").status == "unavailable"
    assert store.requests == []


def test_not_enough_disk_is_not_downloaded(
    tmp_path, store, snapshot_bytes, monkeypatch
):
    usage = namedtuple("usage", "total used free")
    monkeypatch.setattr(
        gene_snapshot.shutil,
        "disk_usage",
        lambda _: usage(0, 0, len(snapshot_bytes) - 1),
    )
    service = load(tmp_path, write_pin(tmp_path / "pin.json", snapshot_bytes))
    assert service.status == "unavailable"
    assert store.requests == []


def test_a_partial_download_left_by_a_killed_process_is_cleared(
    tmp_path, store, snapshot_bytes, monkeypatch
):
    # Room for the snapshot only once the stale partial file is gone.
    pin_path = write_pin(tmp_path / "pin.json", snapshot_bytes)
    (tmp_path / "genes").mkdir()
    partial = tmp_path / "genes" / f"{read_pin(pin_path).build_id}.duckdb.partial"
    partial.write_bytes(b"x" * 100)
    usage = namedtuple("usage", "total used free")
    size = len(snapshot_bytes)
    monkeypatch.setattr(
        gene_snapshot.shutil,
        "disk_usage",
        lambda _: usage(0, 0, size - 1 if partial.exists() else size),
    )
    store.responses.append(httpx.Response(200, content=snapshot_bytes))
    assert load(tmp_path, pin_path).status == "ready"


def test_an_unwritable_directory_is_not_downloaded_to(tmp_path, store, snapshot_bytes):
    (tmp_path / "genes").mkdir(mode=0o500)
    service = load(tmp_path, write_pin(tmp_path / "pin.json", snapshot_bytes))
    assert service.status == "unavailable"
    assert store.requests == []


def test_a_file_already_downloaded_is_reused(tmp_path, store, snapshot_bytes):
    # As when the same container restarts.
    (tmp_path / "genes").mkdir()
    pin_path = write_pin(tmp_path / "pin.json", snapshot_bytes)
    (tmp_path / "genes" / f"{read_pin(pin_path).build_id}.duckdb").write_bytes(
        snapshot_bytes
    )
    assert load(tmp_path, pin_path).status == "ready"
    assert store.requests == []


def test_a_damaged_earlier_download_is_replaced(
    tmp_path, store, snapshot_bytes, monkeypatch
):
    (tmp_path / "genes").mkdir()
    pin_path = write_pin(tmp_path / "pin.json", snapshot_bytes)
    damaged = bytearray(snapshot_bytes)
    damaged[-1] ^= 0xFF
    cached = tmp_path / "genes" / f"{read_pin(pin_path).build_id}.duckdb"
    cached.write_bytes(damaged)
    # Room for one copy only: the damaged one has to go first.
    usage = namedtuple("usage", "total used free")
    size = len(snapshot_bytes)
    monkeypatch.setattr(
        gene_snapshot.shutil,
        "disk_usage",
        lambda _: usage(0, 0, size - 1 if cached.exists() else size),
    )
    store.responses.append(httpx.Response(200, content=snapshot_bytes))
    assert load(tmp_path, pin_path).status == "ready"
    assert len(store.requests) == 1


def test_shutdown_stops_the_retries(tmp_path, store, snapshot_bytes, monkeypatch):
    monkeypatch.setattr(gene_snapshot, "RETRY_WAITS", (600,))
    store.responses.append(httpx.Response(403))
    service = GeneCatalogService.pinned(
        write_pin(tmp_path / "pin.json", snapshot_bytes), tmp_path / "genes", ""
    )
    service.start()
    service.close()
    assert not join_loader(service, timeout=5).is_alive()


@pytest.fixture
def pinned_mode(tmp_path, monkeypatch):
    """The app as the servers run it: no local file, so it serves the pin."""
    monkeypatch.delenv("GENE_SNAPSHOT_PATH")
    monkeypatch.setenv("GENE_SNAPSHOT_DIR", str(tmp_path / "genes"))


@pytest.mark.usefixtures("pinned_mode")
def test_gene_data_failing_leaves_the_app_healthy(app_with_stubbed_agent, store):
    store.responses.append(httpx.Response(403))
    with TestClient(app_with_stubbed_agent) as client:
        join_loader(get_gene_catalog_service())
        health = client.get("/api/v1/health")
        assert health.status_code == 200
        assert health.json()["status"] == "healthy"
        assert health.json()["genes"]["status"] == "unavailable"
        assert client.get(f"/api/v1/genes/{AMA1}").status_code == 503
        assert client.get("/api/v1/version").status_code == 200


@pytest.mark.parametrize(
    "sql",
    [
        "SELECT * FROM read_csv('{path}')",
        "ATTACH '{path}' AS other",
        "COPY gene TO '{path}'",
        "SELECT * FROM 'https://genes.test/x.csv'",
        "LOAD httpfs",
        "SET enable_external_access = true",
        # Refused only because the file is opened read-only.
        "CREATE TABLE other (i INTEGER)",
        # Refused only because the configuration is locked.
        "SET memory_limit = '8GB'",
    ],
)
def test_a_snapshot_cannot_reach_beyond_its_own_file(gene_snapshot_path, tmp_path, sql):
    service = GeneCatalogService.local(str(gene_snapshot_path), "")
    assert service._con is not None
    cur = service._con.cursor()
    with pytest.raises((duckdb.PermissionException, duckdb.InvalidInputException)):
        cur.execute(sql.format(path=tmp_path / "other.csv"))
    cur.close()
    service.close()


def test_the_committed_pin_is_one_this_release_reads():
    # Fails a pin change whose snapshot the backend can't read, or that
    # points anywhere but the gene data store's snapshots folder.
    pin = read_pin(GENE_SNAPSHOT_PIN_PATH)
    assert pin.schema_version == SCHEMA_VERSION
    assert pin.url.endswith(f"/snapshots/{pin.build_id}.duckdb")
