"""
Filters over a kmindex job's export parquet.

Everything here runs against a small export-shaped parquet written with
DuckDB, so no mirror and no Galaxy are needed: the export already carries the
joined metadata, which is the whole reason filtering can run over it.
"""

from unittest.mock import AsyncMock, MagicMock

import duckdb
import pytest

from app.services.kmindex_filters import (
    KmindexFilters,
    iter_subset_tsv,
    parse_filter_params,
    subset_page,
    subset_row_count,
    subset_summary,
    where,
)
from app.services.sra_mirror import EXPORT_COLUMNS, EXPORT_COORDINATE_COLUMNS

# One row per hit, in rank order (score descending), every export column.
# SRR07 is a hit the mirror does not carry: every metadata column NULL.
# SRR05/SRR06 are the two raw strings that share PSE. Borneo is recorded but
# is not a country. The quote in SRR08's study is there to be bound, not
# interpolated.
_ROWS = [
    # acc, score, organism, assay, platform, instrument, layout, released,
    # country, bioproject, study, mbases, lat, lon
    ("SRR01", 0.99, "E. coli", "WGS", "ILLUMINA", "NovaSeq", "PAIRED",
     "2015-03-01", "Kenya", "PRJ1", "SRP1", 100, -1.29, 36.82),
    ("SRR02", 0.95, "E. coli", "WGS", "OXFORD_NANOPORE", "MinION", "SINGLE",
     "2016-05-01", "Malawi", "PRJ1", "SRP1", 200, -13.9, 33.7),
    ("SRR03", 0.90, "Salmonella", "AMPLICON", "ILLUMINA", "MiSeq", "PAIRED",
     "2018-01-01", "USA", "PRJ2", "SRP2", 50, None, None),
    ("SRR04", 0.85, "Salmonella", "WGS", "ILLUMINA", "MiSeq", "PAIRED",
     "2020-01-01", None, "PRJ2", "SRP2", 70, None, None),
    ("SRR05", 0.80, "E. coli", "WGS", "PACBIO_SMRT", "Sequel", "SINGLE",
     "2020-06-01", "Gaza Strip", "PRJ3", "SRP3", 10, None, None),
    ("SRR06", 0.75, "E. coli", "RNA-Seq", "ILLUMINA", "NovaSeq", "PAIRED",
     "2021-01-01", "West Bank", "PRJ3", "SRP3", 10, None, None),
    ("SRR07", 0.70, None, None, None, None, None,
     None, None, None, None, None, None, None),
    ("SRR08", 0.65, "Vibrio", "WGS", "ILLUMINA", "NovaSeq", "PAIRED",
     "2019-01-01", "Kenya", "PRJ4", "O'Brien's study", 30, -1.29, 36.82),
    ("SRR09", 0.60, "E. coli", "WGS", None, None, "PAIRED",
     "2015-07-01", "Kenya", "PRJ1", "SRP1", 5, None, None),
    ("SRR10", 0.55, "E. coli", "WGS", "ILLUMINA", "NovaSeq", "PAIRED",
     "2019-02-01", "Borneo", "PRJ5", "SRP5", 5, None, None),
]  # fmt: skip

_IN_MIRROR = 9


def _literal(value):
    if value is None:
        return "NULL"
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    return repr(value)


def write_export(path, rows=_ROWS):
    """Write an export-shaped parquet, column for column what the writer makes."""
    selects = []
    for (
        acc,
        score,
        organism,
        assay,
        platform,
        instrument,
        layout,
        released,
        country,
        bioproject,
        study,
        mbases,
        lat,
        lon,
    ) in rows:
        values = {
            "accession": _literal(acc),
            "score": f"CAST({score} AS DOUBLE)",
            "ani": f"round(pow({score}, 1.0 / 31), 4)",
            "fp_correction": "CAST(NULL AS DOUBLE)",
            "shard": "'IDX_1'",
            "organism": _literal(organism),
            "assay_type": _literal(assay),
            "platform": _literal(platform),
            "instrument": _literal(instrument),
            "library_layout": _literal(layout),
            "release_date": (
                f"DATE '{released}'" if released else "CAST(NULL AS DATE)"
            ),
            "country": _literal(country),
            "bioproject": _literal(bioproject),
            "study": _literal(study),
            "mbases": f"CAST({_literal(mbases)} AS BIGINT)",
            "latitude": f"CAST({_literal(lat)} AS DOUBLE)",
            "longitude": f"CAST({_literal(lon)} AS DOUBLE)",
        }
        columns = EXPORT_COLUMNS + EXPORT_COORDINATE_COLUMNS
        selects.append("SELECT " + ", ".join(f"{values[c]} AS {c}" for c in columns))
    con = duckdb.connect()
    try:
        con.execute(
            f"COPY ({' UNION ALL '.join(selects)}) TO '{path}' (FORMAT parquet)"
        )
    finally:
        con.close()
    return path


@pytest.fixture
def export(tmp_path):
    return write_export(tmp_path / "job1.parquet")


def accessions(path, filters, **kwargs):
    page = subset_page(path, filters, kwargs.pop("limit", 100), 0, **kwargs)
    return [hit["accession"] for hit in page["hits"]]


def facet(summary, name):
    return next(f for f in summary["cohort"]["facets"] if f["name"] == name)


def facet_counts(summary, name):
    return {v["value"]: v["count"] for v in facet(summary, name)["values"]}


class TestParsing:
    def test_no_filter_params_is_none(self):
        # None, not an empty filter: that is what keeps the existing path.
        assert parse_filter_params([("limit", "25"), ("job", "x")]) is None

    def test_repeated_keys_are_one_list_and_dedupe(self):
        filters = parse_filter_params(
            [("f.country", "Kenya"), ("f.country", "Malawi"), ("f.country", "Kenya")]
        )
        assert filters.country == ["Kenya", "Malawi"]

    def test_year_forms(self):
        assert parse_filter_params([("f.year", "2015..2020")]).year_min == 2015
        single = parse_filter_params([("f.year", "2019")])
        assert (single.year_min, single.year_max) == (2019, 2019)
        open_ended = parse_filter_params([("f.year", "2018..")])
        assert (open_ended.year_min, open_ended.year_max) == (2018, None)

    @pytest.mark.parametrize(
        "items",
        [
            [("f.organism", "E. coli")],
            [("f.year", "soon")],
            [("f.year", "..")],
            [("f.year", "2020..2015")],
            [("f.year", "2015"), ("f.year", "2016")],
            [("f.score", "high")],
            [("f.score", "1.5")],
            [("f.country_iso", "Kenya")],
            [("f.country_iso", "__none__")],
            [("f.platform", "x" * 201)],
            [("f.platform", str(i)) for i in range(51)],
        ],
    )
    def test_bad_input_is_a_value_error(self, items):
        with pytest.raises(ValueError):
            parse_filter_params(items)

    def test_where_binds_values_rather_than_interpolating(self):
        sql, params = where(KmindexFilters(platform=["x' OR 1=1 --"]))
        assert "OR 1=1" not in sql
        assert params == {"v_platform": ["x' OR 1=1 --"]}


class TestSubsetPage:
    def test_no_filter_is_rank_order(self, export):
        assert accessions(export, KmindexFilters()) == [r[0] for r in _ROWS]

    def test_each_list_field_narrows(self, export):
        assert accessions(export, KmindexFilters(platform=["ILLUMINA"])) == [
            "SRR01",
            "SRR03",
            "SRR04",
            "SRR06",
            "SRR08",
            "SRR10",
        ]
        assert accessions(export, KmindexFilters(assay_type=["AMPLICON"])) == ["SRR03"]
        assert accessions(export, KmindexFilters(instrument=["MinION"])) == ["SRR02"]
        assert accessions(export, KmindexFilters(library_layout=["SINGLE"])) == [
            "SRR02",
            "SRR05",
        ]

    def test_none_is_is_null(self, export):
        # SRR07 is not in the mirror at all, which reads as not recorded too.
        assert accessions(export, KmindexFilters(platform=["__none__"])) == [
            "SRR07",
            "SRR09",
        ]
        both = KmindexFilters(platform=["__none__", "PACBIO_SMRT"])
        assert accessions(export, both) == ["SRR05", "SRR07", "SRR09"]

    def test_hostile_values_match_nothing_and_do_not_error(self, export):
        for value in ("x' OR 1=1 --", "'; DROP TABLE runs; --", "O'Brien's study"):
            assert accessions(export, KmindexFilters(platform=[value])) == []

    def test_fields_and_together(self, export):
        filters = KmindexFilters(platform=["ILLUMINA"], assay_type=["WGS"])
        assert accessions(export, filters) == ["SRR01", "SRR04", "SRR08", "SRR10"]

    def test_country_iso_resolves_every_raw_string_with_that_code(self, export):
        assert accessions(export, KmindexFilters(country_iso=["PSE"])) == [
            "SRR05",
            "SRR06",
        ]

    def test_country_and_country_iso_are_one_dimension(self, export):
        filters = KmindexFilters(country=["Malawi"], country_iso=["KEN"])
        assert accessions(export, filters) == ["SRR01", "SRR02", "SRR08", "SRR09"]

    def test_an_iso_code_with_no_runs_matches_nothing(self, export):
        assert accessions(export, KmindexFilters(country_iso=["FRA"])) == []

    def test_year_and_score_ranges(self, export):
        years = KmindexFilters(year_min=2020, year_max=2021)
        assert accessions(export, years) == ["SRR04", "SRR05", "SRR06"]
        assert accessions(export, KmindexFilters(score_min=0.9)) == [
            "SRR01",
            "SRR02",
            "SRR03",
        ]

    def test_matched_counts_every_row_not_the_page(self, export):
        page = subset_page(export, KmindexFilters(platform=["ILLUMINA"]), 2, 2)
        assert page["matched"] == 6
        assert [h["accession"] for h in page["hits"]] == ["SRR04", "SRR06"]

    def test_score_ascending_reverses_rank(self, export):
        got = accessions(export, KmindexFilters(), sort="score", order="asc")
        assert got == [r[0] for r in reversed(_ROWS)]

    def test_metadata_sort_puts_nulls_last_and_breaks_ties_by_rank(self, export):
        got = accessions(export, KmindexFilters(), sort="country", order="asc")
        assert got[:4] == ["SRR10", "SRR05", "SRR01", "SRR08"]
        assert got[-2:] == ["SRR04", "SRR07"]

    def test_rows_carry_metadata_and_a_missing_run_has_none(self, export):
        hits = subset_page(export, KmindexFilters(), 10, 0)["hits"]
        assert hits[0]["sra"]["release_date"] == "2015-03-01"
        assert hits[0]["sra"]["library_layout"] == "PAIRED"
        assert hits[6]["accession"] == "SRR07" and hits[6]["sra"] is None


class TestSubsetSummary:
    def test_unfiltered_partitions_reconcile(self, export):
        summary = subset_summary(export, KmindexFilters())
        cohort, geography = summary["cohort"], summary["geography"]
        assert summary["matched"] == len(_ROWS)
        assert cohort["total"] == len(_ROWS)
        assert cohort["in_mirror"] == _IN_MIRROR
        for f in cohort["facets"]:
            parts = sum(v["count"] for v in f["values"]) + f["other"] + f["unknown"]
            assert parts == _IN_MIRROR, f["name"]
        unmapped = sum(c["count"] for c in geography["unmapped_countries"])
        drawn = sum(c["count"] for c in geography["countries"])
        assert drawn + unmapped + geography["unknown"] == geography["in_mirror"]
        assert geography["in_mirror"] == _IN_MIRROR

    def test_unfiltered_scalars(self, export):
        cohort = subset_summary(export, KmindexFilters())["cohort"]
        assert cohort["organisms"] == 3
        assert cohort["bioprojects"] == 5
        assert cohort["countries"] == 6
        assert cohort["top_organisms"][0] == {"count": 6, "value": "E. coli"}

    def test_each_breakdown_leaves_its_own_field_out(self, export):
        summary = subset_summary(export, KmindexFilters(platform=["ILLUMINA"]))
        # The platform bars still show the platforms not picked...
        assert facet_counts(summary, "platform") == {
            "ILLUMINA": 6,
            "OXFORD_NANOPORE": 1,
            "PACBIO_SMRT": 1,
        }
        assert facet(summary, "platform")["unknown"] == 1
        # ...while every other breakdown, and the headline, is ILLUMINA only.
        assert facet_counts(summary, "assay_type") == {
            "WGS": 4,
            "AMPLICON": 1,
            "RNA-Seq": 1,
        }
        assert summary["matched"] == 6
        assert summary["cohort"]["in_mirror"] == 6

    def test_map_and_country_bars_leave_country_out(self, export):
        summary = subset_summary(
            export, KmindexFilters(country_iso=["KEN"], platform=["ILLUMINA"])
        )
        geography = summary["geography"]
        drawn = {c["iso_a3"]: c["count"] for c in geography["countries"]}
        # Every ILLUMINA country, not just Kenya, so another can be added.
        assert drawn == {"KEN": 2, "USA": 1, "PSE": 1}
        assert facet_counts(summary, "country")["USA"] == 1
        # The points are counted over the same set as the choropleth.
        assert geography["located"] == 2
        assert summary["matched"] == 2

    def test_year_timeline_leaves_year_out(self, export):
        summary = subset_summary(export, KmindexFilters(year_min=2020, year_max=2020))
        years = facet_counts(summary, "release_year")
        assert years["2015"] == 2 and years["2020"] == 2
        assert summary["matched"] == 2

    def test_a_value_every_row_of_which_is_filtered_out_is_not_listed(self, export):
        summary = subset_summary(export, KmindexFilters(assay_type=["AMPLICON"]))
        assert facet_counts(summary, "platform") == {"ILLUMINA": 1}

    def test_an_export_without_coordinates_has_null_locations(self, tmp_path):
        path = tmp_path / "old.parquet"
        con = duckdb.connect()
        try:
            con.execute(
                f"COPY (SELECT * EXCLUDE (latitude, longitude) "
                f"FROM read_parquet('{write_export(tmp_path / 'x.parquet')}')) "
                f"TO '{path}' (FORMAT parquet)"
            )
        finally:
            con.close()
        geography = subset_summary(path, KmindexFilters())["geography"]
        assert geography["locations"] is None and geography["located"] is None


class TestSubsetTsv:
    def test_streams_only_matching_rows_in_rank_order(self, export):
        filters = KmindexFilters(country_iso=["PSE"])
        body = b"".join(iter_subset_tsv(export, filters)).decode()
        lines = body.splitlines()
        assert lines[0].split("\t")[:2] == ["accession", "score"]
        assert "file_row_number" not in lines[0]
        assert [line.split("\t")[0] for line in lines[1:]] == ["SRR05", "SRR06"]
        assert subset_row_count(export, filters) == 2


def _aggregate(status="available"):
    return {
        "export": {"status": status},
        "hits": [{"accession": r[0], "score": r[1], "shard": "IDX_1"} for r in _ROWS],
        "per_index": [],
        "query_name": "q",
        "shards_failed": 0,
        "shards_searched": 1,
        "shards_with_hits": 1,
        "total_matches": len(_ROWS),
        "truncated": False,
    }


class TestRoutes:
    """The filter params on /results, the new /summary, and the export."""

    @staticmethod
    def _client(monkeypatch, export_dir, aggregate, mirror=None):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient

        from app.api.v1 import galaxy as galaxy_api
        from app.core.config import get_settings
        from app.core.dependencies import check_rate_limit
        from app.services.galaxy_service import GalaxyService

        monkeypatch.setenv("GALAXY_API_KEY", "test-key")
        monkeypatch.setenv("KMINDEX_EXPORT_DIR", str(export_dir))
        get_settings.cache_clear()
        cache = MagicMock()
        cache.claim = AsyncMock(return_value=True)
        cache.delete = AsyncMock(return_value=True)
        cache.get = AsyncMock(return_value=aggregate)
        cache.set = AsyncMock(return_value=True)
        cache.make_key = MagicMock(return_value="k")
        service = GalaxyService(cache)
        service.gi = MagicMock()
        service._galaxy_available = True
        service.sra_mirror = mirror

        app = FastAPI()
        app.include_router(galaxy_api.router, prefix="/galaxy")
        app.dependency_overrides[check_rate_limit] = lambda: None
        app.dependency_overrides[galaxy_api.get_galaxy_service] = lambda: service
        return TestClient(app)

    def test_results_without_filters_is_the_listing(self, tmp_path, monkeypatch):
        write_export(tmp_path / "job1.parquet")
        client = self._client(monkeypatch, tmp_path, _aggregate())

        body = client.get("/galaxy/kmindex/jobs/job1/results?limit=3").json()

        assert body["filtered"] is False
        assert body["total_hits"] == len(_ROWS)
        # The listing path, which knows nothing of the mirror here.
        assert body["hits"][0]["sra"] is None

    def test_results_with_filters_pages_the_export(self, tmp_path, monkeypatch):
        write_export(tmp_path / "job1.parquet")
        client = self._client(monkeypatch, tmp_path, _aggregate())

        body = client.get(
            "/galaxy/kmindex/jobs/job1/results"
            "?limit=2&f.platform=ILLUMINA&f.country_iso=KEN&f.country=USA"
        ).json()

        assert body["filtered"] is True
        assert body["total_hits"] == 3
        assert body["total_matches"] == len(_ROWS)
        assert body["truncated"] is False
        assert [h["accession"] for h in body["hits"]] == ["SRR01", "SRR03"]
        assert body["hits"][0]["sra"]["country"] == "Kenya"
        assert body["hits"][0]["ani"] is not None

    def test_a_filtered_page_reads_biosample_from_the_mirror(
        self, tmp_path, monkeypatch
    ):
        write_export(tmp_path / "job1.parquet")
        mirror = MagicMock()
        mirror.is_available.return_value = True
        mirror.has_capability.return_value = True
        mirror.runs_by_accession.return_value = {"SRR01": {"biosample": "SAMN01"}}
        client = self._client(monkeypatch, tmp_path, _aggregate(), mirror=mirror)

        body = client.get(
            "/galaxy/kmindex/jobs/job1/results?limit=2&f.country_iso=KEN"
        ).json()

        assert body["hits"][0]["accession"] == "SRR01"
        assert body["hits"][0]["sra"]["biosample"] == "SAMN01"
        # The rest of the row is still the export's, not the mirror's.
        assert body["hits"][0]["sra"]["country"] == "Kenya"

    def test_a_failed_biosample_lookup_keeps_the_page(self, tmp_path, monkeypatch):
        write_export(tmp_path / "job1.parquet")
        mirror = MagicMock()
        mirror.is_available.return_value = True
        mirror.has_capability.return_value = True
        mirror.runs_by_accession.side_effect = RuntimeError("mirror went away")
        client = self._client(monkeypatch, tmp_path, _aggregate(), mirror=mirror)

        body = client.get(
            "/galaxy/kmindex/jobs/job1/results?limit=2&f.country_iso=KEN"
        ).json()

        assert body["filtered"] is True
        assert body["hits"][0]["sra"]["biosample"] is None

    def test_an_unknown_field_is_a_422(self, tmp_path, monkeypatch):
        client = self._client(monkeypatch, tmp_path, _aggregate())

        response = client.get("/galaxy/kmindex/jobs/job1/results?f.organism=x")

        assert response.status_code == 422
        assert "organism" in response.json()["detail"]

    @pytest.mark.parametrize("status", ["unavailable", "too_large"])
    def test_no_export_is_a_409_not_a_filtered_listing(
        self, tmp_path, monkeypatch, status
    ):
        client = self._client(monkeypatch, tmp_path, _aggregate(status))

        for route in ("results", "summary"):
            response = client.get(
                f"/galaxy/kmindex/jobs/job1/{route}?f.platform=ILLUMINA"
            )
            assert response.status_code == 409
            detail = response.json()["detail"]
            assert detail["code"] == "filters_unavailable"
            assert "full match set" in detail["reason"]

    def test_summary(self, tmp_path, monkeypatch):
        write_export(tmp_path / "job1.parquet")
        client = self._client(monkeypatch, tmp_path, _aggregate())

        body = client.get("/galaxy/kmindex/jobs/job1/summary?f.year=2020..2021").json()

        assert body["matched"] == 3
        assert body["total_matches"] == len(_ROWS)
        assert body["cohort"]["total"] == 3
        # The map leaves only country out, so the year filter still applies.
        assert body["geography"]["in_mirror"] == 3

    def test_filtered_tsv_export(self, tmp_path, monkeypatch):
        write_export(tmp_path / "job1.parquet")
        client = self._client(monkeypatch, tmp_path, _aggregate())

        response = client.get(
            "/galaxy/kmindex/jobs/job1/export?format=tsv&f.country_iso=PSE"
        )

        assert response.status_code == 200
        assert "job1-2-filtered-runs.tsv" in response.headers["content-disposition"]
        assert len(response.text.splitlines()) == 3

    def test_filtered_parquet_export_is_refused(self, tmp_path, monkeypatch):
        write_export(tmp_path / "job1.parquet")
        client = self._client(monkeypatch, tmp_path, _aggregate())

        response = client.get(
            "/galaxy/kmindex/jobs/job1/export?format=parquet&f.platform=ILLUMINA"
        )

        assert response.status_code == 422
