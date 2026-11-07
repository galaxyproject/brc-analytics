"""The Logan fixture capture script's offline halves: trimming and derives.

No network: the capture itself only strings HTTP reads together, and its
output is checked by loading the committed fixtures (test_evals_logan.py).
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import duckdb
import pytest

from app.models.logan import LoganSnapshot
from app.services.logan_snapshot import build_logan_snapshot
from tests.test_logan_snapshot import hit
from tests.test_logan_snapshot import results as logan_page

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "capture_logan_fixture.py"


@pytest.fixture(scope="module")
def cap():
    spec = importlib.util.spec_from_file_location("capture_logan_fixture", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _export(path: Path, rows: list[tuple]) -> None:
    con = duckdb.connect()
    con.execute(
        "CREATE TABLE t (accession VARCHAR, score DOUBLE, organism VARCHAR, "
        "country VARCHAR, release_date DATE, latitude DOUBLE)"
    )
    con.executemany("INSERT INTO t VALUES (?, ?, ?, ?, ?, ?)", rows)
    con.execute(f"COPY (SELECT * FROM t) TO '{path}' (FORMAT parquet)")
    con.close()


def _read(path: Path) -> list[tuple]:
    con = duckdb.connect()
    try:
        return con.execute("SELECT * FROM read_parquet(?)", [str(path)]).fetchall()
    finally:
        con.close()


def _rows(n: int) -> list[tuple]:
    # Rank order is file order. Organisms: a dominant one, a mid one, and
    # three singletons deep in the tail that a uniform sample would lose.
    out = []
    for i in range(n):
        if i in (n - 3, n - 2, n - 1):
            org, country = f"rare {i}", "Malawi"
        elif i % 5 == 0:
            org, country = "mid", None
        else:
            org, country = "dominant", "Kenya" if i % 2 else None
        out.append((f"SRR{i:06d}", 1.0 - i / (n * 2), org, country, None, None))
    return out


def test_small_export_is_copied_whole(cap, tmp_path):
    src, dest = tmp_path / "in.parquet", tmp_path / "out.parquet"
    rows = _rows(20)
    _export(src, rows)
    info = cap.trim_export(src, dest, max_rows=50, top=10)
    assert info["rows_total"] == info["rows_kept"] == 20
    assert info["method"] == "whole file"
    assert _read(dest) == rows


def test_trim_keeps_the_top_and_samples_every_stratum(cap, tmp_path):
    src, dest = tmp_path / "in.parquet", tmp_path / "out.parquet"
    rows = _rows(200)
    _export(src, rows)
    info = cap.trim_export(src, dest, max_rows=30, top=10)
    kept = _read(dest)

    assert info["rows_total"] == 200
    assert info["rows_kept"] == len(kept) == 30
    # Every column, in the export's order.
    assert info["columns"] == [
        "accession",
        "score",
        "organism",
        "country",
        "release_date",
        "latitude",
    ]
    assert all(len(r) == 6 for r in kept)
    # The top ten by rank, exactly.
    assert kept[:10] == rows[:10]
    # Rank order survives: scores never increase down the file.
    scores = [r[1] for r in kept]
    assert scores == sorted(scores, reverse=True)
    # Every (organism, country) stratum in the tail is represented, including
    # the three singletons at the very bottom.
    tail_strata = {(r[2], r[3]) for r in rows[10:]}
    assert tail_strata <= {(r[2], r[3]) for r in kept[10:]}


def test_trim_is_deterministic(cap, tmp_path):
    src = tmp_path / "in.parquet"
    _export(src, _rows(200))
    a, b = tmp_path / "a.parquet", tmp_path / "b.parquet"
    cap.trim_export(src, a, max_rows=30, top=10)
    cap.trim_export(src, b, max_rows=30, top=10)
    assert _read(a) == _read(b)


def test_trim_rejects_a_top_larger_than_the_budget(cap, tmp_path):
    with pytest.raises(ValueError):
        cap.trim_export(tmp_path / "x", tmp_path / "y", max_rows=5, top=10)


def _fixture(n_hits: int = 25) -> dict:
    hits = [hit(f"ERR{100000 + i}", round(1.0 - i * 0.01, 3)) for i in range(n_hits)]
    page = logan_page(hits=hits)
    data = build_logan_snapshot(page, captured_at="t").model_dump(mode="json")
    data["_fixture"] = {
        "results": page.model_dump(mode="json"),
        "parquet": "src.parquet",
        "geography": {"countries": []},
    }
    return data


def _reloads(data: dict) -> LoganSnapshot:
    return LoganSnapshot.model_validate(json.loads(json.dumps(data)))


def test_derive_rekeys_under_its_own_job_and_drops_the_parquet(cap):
    src = _fixture()
    out = cap.derive(src, "no_mirror", "src")
    assert out["job_id"] != src["job_id"]
    assert len(out["job_id"]) == 16
    assert out["job_id"] == cap.derived_job_id(src["job_id"], "no_mirror")
    assert out["results_url"] == f"/logan-search?job={out['job_id']}"
    assert out["_fixture"]["results"]["job_id"] == out["job_id"]
    assert out["_fixture"]["parquet"] is None
    assert out["_fixture"]["derived"]["from_job_id"] == src["job_id"]
    # The source is untouched.
    assert src["cohort"] is not None
    _reloads(out)


def test_derive_saturated(cap):
    src = _fixture()
    out = cap.derive(src, "saturated", "src")
    top = out["top_hits"]
    changed = [h for h in top if h["organism"] == cap.SATURATED_ORGANISM]
    assert len(changed) == 6
    assert changed == top[-6:]
    # Still a score sort, and each rewritten hit sits below its source score.
    scores = [h["score"] for h in top]
    assert scores == sorted(scores, reverse=True)
    for before, after in zip(src["top_hits"][-6:], changed, strict=True):
        assert after["score"] < before["score"]
    raw = {h["accession"]: h for h in out["_fixture"]["results"]["hits"]}
    assert {raw[h["accession"]]["fp_correction"] for h in changed} == {0.2}
    untouched = {h["accession"] for h in top[:-6]}
    assert all(raw[a]["fp_correction"] is None for a in untouched)
    _reloads(out)


def test_derive_saturated_needs_enough_hits(cap):
    with pytest.raises(ValueError):
        cap.derive(_fixture(n_hits=5), "saturated", "src")


def test_derive_no_mirror(cap):
    out = cap.derive(_fixture(), "no_mirror", "src")
    assert out["cohort"] is None
    assert out["sra_mirror_available"] is False
    assert all(h["organism"] is None for h in out["top_hits"])
    assert all(h["sra"] is None for h in out["_fixture"]["results"]["hits"])
    assert out["_fixture"]["geography"] is None
    snap = _reloads(out)
    assert snap.cohort is None


def test_derive_injected(cap):
    src = _fixture()
    out = cap.derive(src, "injected", "src")
    assert out["query_name"] == cap.INJECTED_QUERY_NAME
    assert out["cohort"]["top_organisms"][1]["value"] == cap.INJECTED_ORGANISM
    assert (
        out["_fixture"]["injected_replaced_organism"]
        == src["cohort"]["top_organisms"][1]["value"]
    )
    # Both strings fit the prompt's 80-character cap, so the model sees them
    # whole -- the point of the case.
    assert len(cap.INJECTED_QUERY_NAME) <= 80 and len(cap.INJECTED_ORGANISM) <= 80
    _reloads(out)


def test_unknown_transform(cap):
    with pytest.raises(ValueError, match="unknown transform"):
        cap.derive(_fixture(), "nope", "src")


def test_search_parameters_records_unknowns(cap):
    params = cap.search_parameters(
        {"per_index": [{"index": "GENOMIC_INV"}], "query_name": "q"}
    )
    assert params == {
        "indexes": ["GENOMIC_INV"],
        "query_name": "q",
        "threshold": "unknown",
        "query_bases": "unknown",
    }
    assert cap.search_parameters({})["indexes"] == "unknown"


def test_trim_keeps_the_tails_proportions(cap, tmp_path):
    """A stratum's share of the sample tracks its share of the tail: a sample
    that favours rare strata would invert exactly the mixes a truncated
    fixture exists to show."""
    src, dest = tmp_path / "in.parquet", tmp_path / "out.parquet"
    rows = []
    for i in range(2000):
        if i < 1400:
            org = "big"
        elif i < 1900:
            org = "mid"
        else:
            org = f"rare {i % 50}"  # 50 strata of two rows each
        rows.append((f"SRR{i:06d}", 1.0 - i / 4000, org, None, None, None))
    _export(src, rows)
    cap.trim_export(src, dest, max_rows=300, top=100)
    tail = _read(dest)[100:]
    big = sum(r[2] == "big" for r in tail)
    mid = sum(r[2] == "mid" for r in tail)
    # The tail (rows 100+) is 1300 big, 500 mid, 100 rare: 68% / 26% / 5%.
    assert 0.6 <= big / len(tail) <= 0.72
    assert 0.2 <= mid / len(tail) <= 0.3
