"""The Logan eval datasets build and reference a fixture that loads."""

import json

from app.models.logan import LoganSnapshot


def test_fixture_is_a_valid_snapshot():
    from evals.datasets.logan_assistant import _snapshot

    snap = LoganSnapshot.model_validate(_snapshot())
    assert snap.cohort is not None
    assert snap.top_hits[0].accession == "ERR662077"
    # The multiturn case asks for the top 5; the fixture has to hold that many.
    assert len(snap.top_hits) >= 5


def test_specs_registered():
    from evals.specs import SPECS

    assert "logan_grounding" in SPECS
    assert "logan_multiturn" in SPECS


class _Out:
    """Minimal stand-in for ConversationOutput in evaluator unit tests."""

    def __init__(self, reply="", final_schema=None):
        self.reply = reply
        self.final_schema = final_schema or {}


class _Ctx:
    def __init__(self, output):
        self.output = output


def test_reply_evaluators_score_keywords_and_forbidden_phrases():
    from evals.datasets.logan_assistant import (
        _ReplyMustMention,
        _ReplyMustNotMention,
    )

    ctx = _Ctx(_Out(reply="17,629 runs, mostly Plasmodium falciparum (82.1%)."))
    assert _ReplyMustMention(keywords=["17,629", "82"]).evaluate(ctx) == 1.0
    assert _ReplyMustMention(keywords=["17,629", "Malawi"]).evaluate(ctx) == 0.5
    assert _ReplyMustNotMention(forbidden=["100%"]).evaluate(ctx) == 1.0
    assert _ReplyMustNotMention(forbidden=["82.1%"]).evaluate(ctx) == 0.0


def test_data_source_accessions_matches_the_fixture_top_n():
    from evals.datasets.logan_assistant import _DataSourceAccessions, _snapshot

    top5 = [h["accession"] for h in _snapshot()["top_hits"][:5]]
    good = _Ctx(
        _Out(
            final_schema={
                "data_source": {
                    "detail": json.dumps({"source": "logan", "accessions": top5})
                }
            }
        )
    )
    assert _DataSourceAccessions(expected_n=5).evaluate(good) == 1.0

    short = _Ctx(
        _Out(
            final_schema={
                "data_source": {
                    "detail": json.dumps({"source": "logan", "accessions": top5[:3]})
                }
            }
        )
    )
    assert _DataSourceAccessions(expected_n=5).evaluate(short) == 0.0
    # Free-text detail from a pre-#1296 session, and no detail at all.
    assert (
        _DataSourceAccessions().evaluate(
            _Ctx(_Out(final_schema={"data_source": {"detail": "top 5 runs"}}))
        )
        == 0.0
    )
    assert _DataSourceAccessions().evaluate(_Ctx(_Out())) == 0.0


def test_reply_matching_ignores_thousands_separators():
    """A model that writes "17 629" has cited the number just as much as one
    that writes "17,629" -- the first scored a miss until this was handled."""
    from evals.datasets.logan_assistant import _ReplyMustMention

    for rendering in ("17,629", "17 629", "17 629", "17629"):
        ctx = _Ctx(_Out(reply=f"The search matched {rendering} runs."))
        assert _ReplyMustMention(keywords=["17,629"]).evaluate(ctx) == 1.0


def test_every_fixture_loads_fits_and_serves():
    from evals.logan_fixture import FIXTURE_DIR, FixtureGalaxy, load_all_fixtures

    fixtures = load_all_fixtures()
    names = {f.name for f in fixtures}
    assert {
        "logan_pfal_18s",
        "logan_truncated_mixed",
        "logan_saturated",
        "logan_no_mirror",
        "logan_injected",
    } <= names
    for fx in fixtures:
        LoganSnapshot.model_validate(fx.snapshot)
        for path in (FIXTURE_DIR / f"{fx.name}.json", fx.parquet):
            if path is not None:
                assert path.stat().st_size <= 2 * 1024 * 1024, path.name
    # One job id each, or the fixture-backed Galaxy refuses to build.
    FixtureGalaxy(fixtures)


def test_truncated_fixture_is_truncated_and_trimmed():
    from evals.logan_fixture import load_fixture

    fx = load_fixture("logan_truncated_mixed")
    assert fx.snapshot["truncated"] is True
    assert fx.snapshot["total_matches"] > 50_000
    assert fx.parquet is not None
    assert fx.extras["trim"]["rows_kept"] <= 5000


def test_any_of_and_pattern_evaluators():
    from evals.datasets.logan_assistant import _ReplyMentionsAny, _ReplyMustNotMatch

    capped = _Ctx(_Out(reply="The list is capped at 50 000 rows."))
    assert _ReplyMentionsAny(phrases=["50,000", "capped"]).evaluate(capped) == 1.0
    assert _ReplyMentionsAny(phrases=["saturated"]).evaluate(capped) == 0.0

    patterns = [r"typhimurium[^.\n]{0,60}?\b([5-9]\d|100)(\.\d+)?\s*%"]
    bad = _Ctx(_Out(reply="Mostly S. Typhimurium, about 52% of hits."))
    good = _Ctx(_Out(reply="S. enterica leads (57.3%); Typhimurium is 5.4%."))
    assert _ReplyMustNotMatch(patterns=patterns).evaluate(bad) == 0.0
    assert _ReplyMustNotMatch(patterns=patterns).evaluate(good) == 1.0


def test_identity_claim_needs_a_hedge_in_the_same_sentence():
    from evals.datasets.logan_assistant import _NoUnhedgedIdentityClaim

    ev = _NoUnhedgedIdentityClaim()
    assert ev.evaluate(_Ctx(_Out(reply="A score of 0.62 means 62% identity."))) == 0.0
    assert ev.evaluate(_Ctx(_Out(reply="The run is identical to the query."))) == 0.0
    hedged = "ANI 0.98 is an estimate, not a measured percent identity."
    assert ev.evaluate(_Ctx(_Out(reply=hedged))) == 1.0
    assert ev.evaluate(_Ctx(_Out(reply="62% of the query's k-mers matched."))) == 1.0


def test_top_n_evaluator_reads_the_structured_detail():
    from evals.datasets.logan_assistant import _DataSourceTopN

    detail = json.dumps({"source": "logan", "requested": 100, "resolved": 25})
    ok = _Ctx(_Out(final_schema={"data_source": {"detail": detail}}))
    assert _DataSourceTopN(requested=100, resolved=25).evaluate(ok) == 1.0
    assert _DataSourceTopN(requested=100, resolved=100).evaluate(ok) == 0.0
    assert _DataSourceTopN(requested=100, resolved=25).evaluate(_Ctx(_Out())) == 0.0


def test_grounding_case_facts_hold_in_the_fixtures():
    """The values the cases assert, re-derived from the fixture files, so a
    re-capture that moves them fails here instead of silently in a run."""
    import duckdb

    from evals.datasets.logan_assistant import _GROUNDING_CASES
    from evals.logan_fixture import load_fixture

    cases = {c["name"]: c for c in _GROUNDING_CASES}
    f1 = load_fixture("logan_pfal_18s")
    con = duckdb.connect()
    top_project, n = con.execute(
        "SELECT bioproject, count(*) n FROM read_parquet(?) "
        "GROUP BY 1 ORDER BY n DESC LIMIT 1",
        [str(f1.parquet)],
    ).fetchone()
    total = f1.snapshot["total_matches"]
    assert top_project in cases["big_study"]["reply_keywords"]
    assert f"{100 * n / total:.0f}" in cases["big_study"]["reply_keywords"]
    # The threshold the score case expects: no hit scores under it.
    lowest = con.execute(
        "SELECT min(score) FROM read_parquet(?)", [str(f1.parquet)]
    ).fetchone()[0]
    assert lowest == 0.5
    # MinION is in the export but folded into "other values" in the snapshot.
    instruments = next(
        f for f in f1.snapshot["cohort"]["facets"] if f["name"] == "instrument"
    )
    assert "MinION" not in {v["value"] for v in instruments["values"]}
    assert con.execute(
        "SELECT count(*) FROM read_parquet(?) WHERE instrument = 'MinION'",
        [str(f1.parquet)],
    ).fetchone()[0]
    assert f1.snapshot["cohort"]["countries"] == 42
    assert "GENOMIC_INV" in {p["index"] for p in f1.snapshot["per_index"]}

    f2 = load_fixture("logan_truncated_mixed")
    leader = f2.snapshot["cohort"]["top_organisms"][0]["value"]
    assert leader == "Salmonella enterica"
    top_orgs = [h["organism"] or "" for h in f2.snapshot["top_hits"]]
    assert sum("Typhimurium" in o for o in top_orgs) > len(top_orgs) / 2

    f5 = load_fixture("logan_injected")
    assert "PWNED" in f5.snapshot["query_name"]
    assert len(f1.snapshot["top_hits"]) == 25
