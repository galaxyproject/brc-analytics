"""The logan_hit entity: CatalogQuery's filter language over one job's export.

Counts are checked against plain SQL over the same fixture file, never against
the engine itself, and the catalog side is checked for not having moved.
"""

from __future__ import annotations

import threading
from pathlib import Path

import duckdb
import pytest
from pydantic import ValidationError

from app.services.tools import catalog_query as cq
from app.services.tools.catalog_query import (
    CatalogQuery,
    LoganExportMismatch,
    LoganHitQuery,
    execute_logan_hits,
)

F1 = (
    Path(__file__).resolve().parents[1]
    / "evals"
    / "datasets"
    / "fixtures"
    / "logan_pfal_18s.parquet"
)


def _sql(where: str) -> int:
    con = duckdb.connect()
    try:
        return con.execute(
            f"SELECT count(*) FROM read_parquet(?) WHERE {where}", [str(F1)]
        ).fetchone()[0]
    finally:
        con.close()


def _q(**kw) -> LoganHitQuery:
    return LoganHitQuery.model_validate(kw)


class TestCatalogUnchanged:
    def test_logan_hit_is_not_a_catalog_entity(self):
        assert cq.CATALOG_ENTITIES == ("assembly", "organism")
        assert "platform" not in cq.FACETABLE_FIELDS
        with pytest.raises(ValidationError):
            CatalogQuery(entity="logan_hit")

    def test_connect_ignores_the_per_call_entity(self, tmp_path):
        # Only the two catalog files exist; a logan_hit source is never asked for.
        (tmp_path / "assemblies.json").write_text("[]")
        (tmp_path / "organisms.json").write_text("[]")
        # Empty arrays fail the drift check, which is fine: the point is that
        # connect() got that far rather than refusing over a missing file.
        assert cq.connect(str(tmp_path)) is None

    def test_a_catalog_entity_still_needs_a_source(self):
        with pytest.raises(ValueError, match="source"):
            cq.EntitySchema(fields={"a": cq.SCALAR}, display=("a",), source="")


class TestValidation:
    def test_defaults(self):
        q = LoganHitQuery()
        assert (q.entity, q.operation, q.filters) == ("logan_hit", "count", [])

    def test_unknown_field_names_the_valid_ones(self):
        with pytest.raises(ValidationError, match="valid fields") as exc:
            _q(filters=[{"field": "taxonomicLevelGenus", "op": "eq", "value": "x"}])
        assert "platform" in str(exc.value)

    def test_range_needs_a_numeric_field(self):
        with pytest.raises(ValidationError, match="numeric field"):
            _q(filters=[{"field": "country", "op": "gt", "value": 3}])

    def test_catalog_facet_fields_are_refused(self):
        with pytest.raises(ValidationError):
            _q(operation="facets", facet_by=["level"])

    def test_facets_need_facet_by(self):
        with pytest.raises(ValidationError, match="facet_by"):
            _q(operation="facets")


class TestExecute:
    def test_count_matches_plain_sql(self):
        q = _q(
            filters=[
                {"field": "country", "op": "eq", "value": "Senegal"},
                {"field": "instrument", "op": "eq", "value": "Illumina NovaSeq 6000"},
            ]
        )
        expected = _sql("country = 'Senegal' AND instrument = 'Illumina NovaSeq 6000'")
        assert execute_logan_hits(q, F1) == {"total": expected}
        assert expected > 0

    def test_release_year_is_a_numeric_filter(self):
        q = _q(
            filters=[
                {"field": "organism", "op": "eq", "value": "Plasmodium vivax"},
                {"field": "release_year", "op": "gt", "value": 2019},
            ]
        )
        expected = _sql("organism = 'Plasmodium vivax' AND year(release_date) > 2019")
        assert execute_logan_hits(q, F1)["total"] == expected

    def test_in_ne_and_score_range(self):
        q = _q(
            filters=[
                {"field": "country", "op": "in", "value": ["Malawi", "Kenya"]},
                {"field": "assay_type", "op": "ne", "value": "WGS"},
                {"field": "score", "op": "gte", "value": 0.9},
            ]
        )
        expected = _sql(
            "country IN ('Malawi', 'Kenya') "
            "AND (assay_type != 'WGS' OR assay_type IS NULL) AND score >= 0.9"
        )
        assert execute_logan_hits(q, F1)["total"] == expected

    def test_empty_result(self):
        q = _q(filters=[{"field": "country", "op": "eq", "value": "Antarctica"}])
        assert execute_logan_hits(q, F1) == {"total": 0}

    def test_list_is_score_ordered_and_capped_with_narrowing_facets(self):
        out = execute_logan_hits(_q(operation="list"), F1)
        rows = out["rows"]
        assert out["total"] == _sql("TRUE")
        assert out["returned"] == len(rows) == 10
        assert out["truncated"] is True
        scores = [r["score"] for r in rows]
        assert scores == sorted(scores, reverse=True)
        assert set(rows[0]) == set(cq.ENTITY_SCHEMA["logan_hit"].display)
        # Single-bucket facets are dropped; country and organism discriminate.
        assert {"country", "organism"} <= set(out["facets"])

    def test_facets(self):
        out = execute_logan_hits(
            _q(
                operation="facets",
                facet_by=["library_layout"],
                filters=[{"field": "country", "op": "eq", "value": "Cambodia"}],
            ),
            F1,
        )
        assert out["facets"]["library_layout"] == {
            "PAIRED": _sql("country = 'Cambodia' AND library_layout = 'PAIRED'"),
            "SINGLE": _sql("country = 'Cambodia' AND library_layout = 'SINGLE'"),
        }

    def test_a_file_of_the_wrong_shape_fails_closed(self, tmp_path):
        bad = tmp_path / "old.parquet"
        con = duckdb.connect()
        con.execute(
            f"COPY (SELECT 'SRR1' AS accession, 0.9 AS score) TO '{bad}' "
            "(FORMAT parquet)"
        )
        con.close()
        with pytest.raises(LoganExportMismatch, match="missing"):
            execute_logan_hits(_q(), bad)

    def test_runs_on_a_private_capped_connection_it_closes(self, monkeypatch):
        from app.services import kmindex_filters

        opened = []
        real = kmindex_filters._connect

        def spy():
            con = real()
            opened.append(con)
            return con

        monkeypatch.setattr(kmindex_filters, "_connect", spy)
        execute_logan_hits(_q(), F1)
        assert len(opened) == 1
        with pytest.raises(duckdb.ConnectionException):
            opened[0].execute("SELECT 1")

    def test_concurrent_calls_from_threads(self):
        """Each call has its own connection, so worker threads can't collide."""
        q = _q(filters=[{"field": "country", "op": "eq", "value": "Malawi"}])
        expected = _sql("country = 'Malawi'")
        results, errors = [], []

        def run():
            try:
                results.append(execute_logan_hits(q, F1)["total"])
            except Exception as e:  # pragma: no cover - reported below
                errors.append(e)

        threads = [threading.Thread(target=run) for _ in range(6)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert not errors
        assert results == [expected] * 6


class TestVocabulary:
    def test_values_come_from_the_engines_facets(self):
        from app.services.tools.catalog_query import logan_vocabulary

        vocab = logan_vocabulary(F1, ("country", "platform", "organism"), 200)
        countries, cut = vocab["country"]
        assert not cut
        assert countries[0] == "Malawi" and "Kenya" in countries
        assert "(none)" not in countries
        assert vocab["platform"][0][0] == "ILLUMINA"

    def test_a_cut_list_says_so_even_with_a_null_bucket(self):
        from app.services.tools.catalog_query import logan_vocabulary

        # Country is mostly NULL in F1, so the NULL bucket is the top one;
        # it must not use up the slot that tells a cut list from a whole one.
        n = len(logan_vocabulary(F1, ("country",), 200)["country"][0])
        values, cut = logan_vocabulary(F1, ("country",), n - 1)["country"]
        assert cut and len(values) == n - 1
        values, cut = logan_vocabulary(F1, ("country",), n)["country"]
        assert not cut and len(values) == n

    def test_a_real_none_value_is_kept_while_the_null_bucket_goes(self, tmp_path):
        from app.services.tools.catalog_query import logan_vocabulary

        # F1 with one country renamed to the literal string the engine uses
        # to label missing values.
        path = tmp_path / "none.parquet"
        con = duckdb.connect()
        con.execute(
            "COPY (SELECT * REPLACE (CASE WHEN country = 'Kenya' THEN '(none)' "
            f"ELSE country END AS country) FROM read_parquet('{F1}')) "
            f"TO '{path}' (FORMAT parquet)"
        )
        con.close()
        values, _ = logan_vocabulary(path, ("country",), 200)["country"]
        assert "(none)" in values and "Kenya" not in values
        assert None not in values

    def test_a_cancel_during_connect_closes_without_running_anything(self, monkeypatch):
        from app.services import kmindex_filters
        from app.services.tools.catalog_query import QueryCancelled, QueryInterrupt

        interrupt = QueryInterrupt()
        opened = []
        real = kmindex_filters._connect

        def connect_then_cancelled():
            con = real()
            opened.append(con)
            interrupt.cancel()  # lands before the connection is registered
            return con

        monkeypatch.setattr(kmindex_filters, "_connect", connect_then_cancelled)
        with pytest.raises(QueryCancelled):
            execute_logan_hits(_q(), F1, interrupt=interrupt)
        with pytest.raises(duckdb.ConnectionException):
            opened[0].execute("SELECT 1")

    def test_a_cancel_between_statements_stops_the_next_one(self, monkeypatch):
        from app.services.tools.catalog_query import QueryCancelled, QueryInterrupt

        interrupt = QueryInterrupt()
        real = cq.execute

        def cancel_first(q, con, **kw):
            # The view is built; cancel before execute() issues its count.
            interrupt.cancel()
            return real(q, con, **kw)

        monkeypatch.setattr(cq, "execute", cancel_first)
        with pytest.raises(QueryCancelled):
            execute_logan_hits(_q(), F1, interrupt=interrupt)

    def test_a_running_statement_is_interrupted(self):
        from app.services.tools.catalog_query import QueryInterrupt

        interrupt = QueryInterrupt()
        seen = []

        class Con:
            def interrupt(self):
                seen.append("interrupt")

        interrupt.attach(Con())
        interrupt.cancel()
        assert seen == ["interrupt"]
        interrupt.detach()
        interrupt.cancel()  # nothing attached: no second interrupt
        assert seen == ["interrupt"]
