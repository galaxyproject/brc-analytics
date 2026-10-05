"""Build the assistant's view of a Logan search from a kmindex result page."""

import re
from typing import Any, Dict, Optional

from app.models.assistant import AnalysisSchema, FieldStatus, SchemaField
from app.models.galaxy import (
    KmindexCohort,
    KmindexFacet,
    KmindexFacetValue,
    KmindexResults,
)
from app.models.logan import LoganContext, LoganSnapshot, LoganTopHit

LOGAN_TOP_HITS = 25
LOGAN_MAX_STRING = 80

# The dominant organism must be at least this share of the mirrored runs
# before the tracker commits to it. Below that the cohort is mixed and the
# person decides.
LOGAN_DOMINANT_SHARE = 0.5

# Anything below space, plus DEL. Newlines included: every string here is
# rendered into one line of the model's instructions, and SRA metadata is
# free text nobody vetted.
_CONTROL = re.compile(r"[\x00-\x1f\x7f]")
_SPACES = re.compile(r"\s+")


def results_url_for(job_id: str) -> str:
    return f"/logan-search?job={job_id}"


def clean_text(value: Optional[str]) -> Optional[str]:
    """Strip control characters, collapse whitespace, cap the length.

    Returns None for an empty result so callers can treat "nothing usable"
    and "nothing recorded" the same way.
    """
    if value is None:
        return None
    text = _SPACES.sub(" ", _CONTROL.sub("", str(value))).strip()
    if not text:
        return None
    return text[:LOGAN_MAX_STRING]


def _clean_facet_value(fv: KmindexFacetValue) -> KmindexFacetValue:
    return KmindexFacetValue(count=fv.count, value=clean_text(fv.value) or "")


def _clean_facet(facet: KmindexFacet) -> KmindexFacet:
    return KmindexFacet(
        name=facet.name,
        other=facet.other,
        unknown=facet.unknown,
        values=[_clean_facet_value(v) for v in facet.values],
    )


def _clean_cohort(cohort: KmindexCohort) -> KmindexCohort:
    return cohort.model_copy(
        update={
            "facets": [_clean_facet(f) for f in cohort.facets],
            "top_organisms": [_clean_facet_value(v) for v in cohort.top_organisms],
        }
    )


def build_logan_snapshot(results: KmindexResults, captured_at: str) -> LoganSnapshot:
    """Reduce a first results page to the snapshot a session keeps.

    `results` must be the first page (offset 0) so the hits are the top of
    the score sort; the caller owns that. Metadata strings are untrusted
    and go through clean_text before they can reach a prompt.
    """
    top_hits = []
    for rank, h in enumerate(results.hits[:LOGAN_TOP_HITS], start=1):
        sra = h.sra
        top_hits.append(
            LoganTopHit(
                rank=rank,
                accession=h.accession,
                score=h.score,
                organism=clean_text(sra.organism) if sra else None,
                platform=clean_text(sra.platform) if sra else None,
                assay_type=clean_text(sra.assay_type) if sra else None,
                library_layout=clean_text(sra.library_layout) if sra else None,
                instrument=clean_text(sra.instrument) if sra else None,
                country=clean_text(sra.country) if sra else None,
                release_date=clean_text(sra.release_date) if sra else None,
                bioproject=clean_text(sra.bioproject) if sra else None,
                study=clean_text(sra.study) if sra else None,
            )
        )
    return LoganSnapshot(
        job_id=results.job_id,
        query_name=clean_text(results.query_name),
        results_url=results_url_for(results.job_id),
        total_matches=results.total_matches,
        total_hits=results.total_hits,
        truncated=results.truncated,
        shards_searched=results.shards_searched,
        shards_with_hits=results.shards_with_hits,
        shards_failed=results.shards_failed,
        per_index=list(results.per_index),
        cohort=_clean_cohort(results.cohort) if results.cohort else None,
        # The page's own flag, not "there is a cohort". Those answer different
        # questions and increasingly diverge: the cohort was computed once at
        # aggregation and cached for a day, while this is set when the mirror
        # answers the annotation query on this read. A mirror removed since
        # aggregation still has a cohort in the cache, and one restored since
        # has none -- and now that availability is per capability, a file can
        # serve annotation while the cohort query is closed.
        sra_mirror_available=results.sra_mirror_available,
        top_hits=top_hits,
        captured_at=captured_at,
    )


def logan_context_from(metadata: Dict[str, Any]) -> Optional[LoganContext]:
    """The UI card's view of a session's snapshot, or None when there is none.

    Fail-soft on a malformed snapshot: a card that doesn't render is better
    than a 500 on every turn of a session whose metadata was hand-edited.
    """
    raw = metadata.get("logan") if metadata else None
    if not isinstance(raw, dict):
        return None
    try:
        snap = LoganSnapshot.model_validate(raw)
    except Exception:
        return None
    cohort = snap.cohort
    top = cohort.top_organisms[0] if cohort and cohort.top_organisms else None
    share = None
    if top is not None and cohort.in_mirror > 0:
        share = top.count / cohort.in_mirror
    return LoganContext(
        job_id=snap.job_id,
        total_matches=snap.total_matches,
        in_mirror=cohort.in_mirror if cohort else 0,
        top_organism=top.value if top else None,
        top_organism_share=share,
        results_url=snap.results_url,
    )


def prefill_from_logan(
    schema: AnalysisSchema, snapshot: LoganSnapshot, catalog: Any
) -> AnalysisSchema:
    """Fill what the cohort proves, and nothing else.

    Organism only: the reflectors own data_characteristics and would wipe a
    prefill, and everything else is a choice. detail is the taxonomy id --
    _reference_assembly_for and the chip validator read it as one -- so the
    provenance sentence lives in the intro, not here.
    """
    out = schema.model_copy(deep=True)
    cohort = snapshot.cohort
    if cohort is None or cohort.in_mirror <= 0 or not cohort.top_organisms:
        return out
    top = cohort.top_organisms[0]
    if top.count / cohort.in_mirror < LOGAN_DOMINANT_SHARE:
        return out
    org = catalog.find_organism_exact(top.value)
    if not org or not org.get("species"):
        return out
    out.organism = SchemaField(
        value=str(org["species"]),
        status=FieldStatus.FILLED,
        detail=str(org.get("taxonomy_id") or "") or None,
    )
    return out
