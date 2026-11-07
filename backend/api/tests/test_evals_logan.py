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
