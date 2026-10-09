"""Galaxy API integration service using BioBLEND."""

import asyncio
import hashlib
import json
import logging
import random
import tempfile
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Literal, Optional, Tuple

import requests
from bioblend import ConnectionError as BioblendConnectionError
from bioblend.galaxy import GalaxyInstance

from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings
from app.core.galaxy_credential import GalaxyCredential
from app.models.galaxy import (
    SETTLED_JOB_STATES,
    TERMINAL_JOB_STATES,
    GalaxyDataset,
    GalaxyJobOutput,
    GalaxyJobResponse,
    GalaxyJobResult,
    GalaxyJobState,
    GalaxyJobStatus,
    GalaxyJobSubmission,
    KmindexHit,
    KmindexOrder,
    KmindexQuerySubmission,
    KmindexResults,
    KmindexSort,
    KmindexSummary,
    SraRunMetadata,
)
from app.services import kmindex_filters
from app.services.kmindex_filters import KmindexFilters
from app.services.kmindex_indexes import FALLBACK_INDEX_NAMES
from app.services.logan_stats import correct_score
from app.services.sra_mirror import (
    CAPABILITY_ANNOTATION,
    CAPABILITY_BIOSAMPLE,
    CAPABILITY_COHORT,
    CAPABILITY_EXPORT,
    CAPABILITY_GEOGRAPHY,
    EXPORT_AVAILABLE,
    EXPORT_TOO_LARGE,
    EXPORT_UNAVAILABLE,
    SRAMirrorService,
    export_file_path,
    export_is_current,
)

logger = logging.getLogger(__name__)


class GalaxyAccountNotLinkedError(Exception):
    """The bearer token verified, but Galaxy has no account linked to it yet.

    Galaxy only maps sub -> user after one browser OIDC login (creates the
    UserAuthnzToken row). str(self) is the URL that completes the link.
    """


class GalaxyJobNotComplete(Exception):
    """The job exists but has not reached a terminal state yet."""


class GalaxyJobFailed(Exception):
    """The job reached a terminal state other than success."""


class GalaxyJobAggregating(Exception):
    """The job finished, and its shards are being merged by another request."""


class GalaxyJobNotFound(Exception):
    """Galaxy has no job under this id (or could not decode it as one)."""


class KmindexFiltersUnavailable(Exception):
    """The job has no current export, so there is nothing to filter over.

    Never answered by filtering the capped listing instead: that is the
    wrong-answer trap the whole-match-set cohort exists to avoid.
    """


class GalaxySubmitNotStarted(Exception):
    """A submission failed before the tool was asked to run.

    So no job can exist for it, and the caller is free to try again. Anything
    that fails from the run_tool call on is ambiguous -- Galaxy may have queued
    the job and lost the reply -- and is raised as a plain Exception instead.
    """


def _is_missing_history_error(e: BaseException) -> bool:
    """Whether Galaxy refused a call because the history it named is gone.

    A cached history id can outlive its history (deleted or purged by hand, or a
    re-pointed account), and Galaxy says so with a 400/403/404 that names the
    history. Our own wrappers re-raise with the bioblend error as the cause, so
    the whole chain is checked.
    """
    seen = set()
    while e is not None and id(e) not in seen:
        seen.add(id(e))
        if isinstance(e, BioblendConnectionError) and getattr(
            e, "status_code", None
        ) in (400, 403, 404):
            detail = f"{getattr(e, 'body', '') or ''} {e}".lower()
            if "history" in detail:
                return True
        e = e.__cause__ or e.__context__
    return False


class KmindexUnknownIndex(GalaxySubmitNotStarted):
    """The submission names an index the pinned tool doesn't offer.

    Caught before anything is uploaded: Galaxy would only reject it at run_tool,
    after the query had already landed in the history.
    """


# Galaxy answers 404 for an id that decodes to nothing, and 400 with its
# MalformedId error (err_code 400009) for one it cannot decode. Both mean the
# caller has the wrong id. Any other 400 is Galaxy refusing something else, and
# must not read as "no such job".
MALFORMED_ID_MARKERS = ("400009", "malformed id", "invalid id")


def is_missing_job_error(e: BioblendConnectionError) -> bool:
    """Whether Galaxy is saying this job id names no job."""
    status = getattr(e, "status_code", None)
    if status == 404:
        return True
    if status != 400:
        return False
    body = getattr(e, "body", None) or ""
    if isinstance(body, bytes):
        body = body.decode("utf-8", errors="replace")
    lowered = str(body).lower()
    return any(marker in lowered for marker in MALFORMED_ID_MARKERS)


# A running job's status is cached only this long. Every open search polls, and
# Galaxy already 429s us, but a completion should still show up promptly.
LIVE_JOB_STATUS_TTL = 10


# Galaxy answers 401 for two very different things: a token it decoded but
# has no linked account for ("Cannot locate user by access token. The user
# should log into Galaxy at least once with this OIDC provider.") and a token
# it rejected outright ("Invalid access token."), which means a bad audience,
# scope, or signature. Only the first is something the user can fix by
# connecting their account -- see galaxy/lib/galaxy/authnz/managers.py.
UNLINKED_ACCOUNT_MARKERS = ("locate user", "log into galaxy")


def is_unlinked_account_error(e: BioblendConnectionError) -> bool:
    """Whether this 401 is Galaxy saying the account is merely unlinked."""
    if getattr(e, "status_code", None) != 401:
        return False
    body = getattr(e, "body", None) or ""
    if isinstance(body, bytes):
        body = body.decode("utf-8", errors="replace")
    lowered = str(body).lower()
    return any(marker in lowered for marker in UNLINKED_ACCOUNT_MARKERS)


# kmindex splits an index into shards and emits one JSON dataset per shard, so a
# single query fans out into dozens of dataset downloads. Galaxy answers 429 if
# those go out unthrottled.
# Tuned against GENOMIC_BCT (55 shards), which blew through a 4-way/5-attempt
# budget and lost 12 shards to nginx 429s. The limiter is per-IP rate rather
# than per-connection, so fewer workers backing off longer beats more workers
# retrying sooner.
KMINDEX_MAX_CONCURRENT_DOWNLOADS = 2
KMINDEX_DOWNLOAD_ATTEMPTS = 7
KMINDEX_BACKOFF_SECONDS = 3.0
# Without jitter the workers fall into lockstep -- they get limited together,
# sleep the same doubling schedule, and hit the limit again in unison.
KMINDEX_BACKOFF_JITTER = 0.5
# Cooldown before the straggler sweep, to let the limiter's window roll over.
KMINDEX_RETRY_SWEEP_DELAY = 20.0

# Ceiling on the merged hit list. A permissive threshold against a large index
# can return far more than anyone will page through, and the whole list is
# cached as one Redis value.
KMINDEX_MAX_HITS = 50000

# A collection archive is a single request covering all the shards, so it gets
# fewer, longer tries than one shard does before falling back to per-shard
# downloads.
KMINDEX_COLLECTION_ATTEMPTS = 3

# Statuses worth backing off and asking again for, rather than dropping the shard.
RETRYABLE_SHARD_STATUSES = frozenset({429, 502, 503, 504})


class ShardFetchError(Exception):
    """A shard GET that came back with something other than 200."""

    def __init__(self, status: int, detail: str):
        super().__init__(f"error {status}: {detail}")
        self.status = status


# Bucket for hits whose shard key matches no known index name. Guessing an
# attribution would corrupt the very number the caller is trusting to tell them
# how much the cap dropped, so name the uncertainty instead.
KMINDEX_UNATTRIBUTED = "(unattributed)"

# Version the aggregate cache key. Entries written before the truncation
# breakdown existed carry `truncated` but no pre-cap count, so reading one back
# would render "50,000 accessions matched, 0 of them missing" -- a contradiction
# asserted more confidently than the bare count it replaced. They live a day and
# clear_caches() does not reach this namespace (CACHE_KEY_PATTERNS in
# app/core/cache.py), so the key itself is what has to change.
#
# v3 adds geography. A v2 entry has no `geography` key, and .get() on it would
# read as "this cohort has no recorded geography" rather than as "this entry
# predates the map" -- an empty world map asserting something about the data
# instead of about the cache. Every existing job pays one re-aggregation the
# first time it is viewed after this deploys, and the assistant's cache-only
# reads miss until that lands; that is a known one-time cliff, not a surprise.
#
# v4 subtracts the false-positive baseline from the 227 saturated samples. A v3
# entry ranks on the raw ratio and carries hits that no longer clear the job's
# threshold once corrected, so serving one back would put the same 227 samples
# near the top of a result set the correction exists to demote.
#
# The version is only half the key. The mirror's capability fingerprint is the
# other half -- see _agg_cache_key, which is what every read and write of this
# namespace goes through.
KMINDEX_AGG_CACHE_PREFIX = "galaxy:kmindex_agg:v4"

# Marker set for the duration of one aggregation, so a second request for the
# same job can answer "still merging" instead of queueing on the lock until the
# proxy gives up on it. A search over every index fans out to thousands of
# shards and takes longer to merge than anything in front of us will wait, and
# a request blocked on the lock holds a connection open the whole time while
# telling the reader nothing. Keyed on the job alone -- it is about the
# aggregation run, not about which mirror will serve the result -- and
# TTL-bounded, so a crashed aggregation cannot park the marker forever. A
# restart shortens that hour to nothing, since clear_caches() sweeps this
# namespace: a process that has just started is not merging anything.
KMINDEX_AGGREGATING_PREFIX = "galaxy:kmindex_aggregating:v1"

# A metadata sort is one DuckDB join over up to 50,000 accessions -- about a
# second -- and every page of a sorted listing needs the same permutation, so
# it is cached beside the aggregate. Keyed on the mirror fingerprint for the
# same reason the aggregate is: a rebuilt mirror can reorder a column.
KMINDEX_ORDER_CACHE_PREFIX = "galaxy:kmindex_order:v1"

# The index list is read off the pinned tool's form, which changes only when a
# new index is published -- rare enough that a day-old answer is right, and
# reading it per page view is what gets us rate-limited: tools.build renders the
# whole form, including the 109-option select, and every visitor's search page
# asks for it. The second entry is the same list kept far longer, as something
# to serve while the first one is being refilled or when Galaxy will not answer
# at all; it is never read while the first one is live, so a stale copy cannot
# mask a fresh answer.
#
# No request ever waits on Galaxy for this. It is the one call the search page
# makes on arrival and the form shows a spinner until it lands, so a request
# that waited out a slow or 429ing Galaxy -- with everyone else queued behind it
# -- was a search page that hung for half a minute. A miss is answered from the
# long-lived copy, or the names shipped with the build, and the refill happens
# behind it in a background task. The list almost never changes, so the copy is
# nearly always exactly right.
#
# Deliberately outside CACHE_KEY_PATTERNS: a restart is exactly when having
# yesterday's answer is worth most, and the boot-time warm refreshes it anyway.
KMINDEX_INDEX_CACHE_PREFIX = "galaxy:kmindex_indexes:v1"
KMINDEX_INDEX_LAST_GOOD_PREFIX = "galaxy:kmindex_indexes_last_good:v1"

# A read that just failed is a read that is about to fail again: the burst which
# trips the rate limit arrives while it is tripped. So a failure is remembered
# briefly, and the misses behind it are answered without starting another
# refresh.
KMINDEX_INDEX_COOLDOWN_PREFIX = "galaxy:kmindex_indexes_cooldown:v1"
KMINDEX_INDEX_COOLDOWN_SECONDS = 60

# bioblend sets no request timeout, and a refresh that never ends is one that
# holds the single-flight slot forever, so no later miss could start another.
# The list is small and the form is rendered server-side in about half a
# second, so half a minute is already far past "slow".
KMINDEX_INDEX_READ_TIMEOUT = 30.0

# bioblend sets no socket timeout by default. We set a global request timeout
# here because requests' timeout is connect + inter-byte read, not total transfer
# time. This means a download that is actually progressing will never trip it,
# only a silent socket will. Therefore, a single timeout value is safe for every
# call site, both short RPCs and long dataset downloads.
GALAXY_REQUEST_TIMEOUT = 30.0

# Aggregation is serialized per lane: it is I/O bound against a service that
# rate-limits us, so overlapping runs make each other slower and can each end up
# with a different partial view of the same job. There are two lanes rather than
# one lock so that partner traffic, which searches every index and so merges
# thousands of shards a job, never parks a BRC user's results behind it.
AggregationLane = Literal["native", "partner"]
_AGGREGATION_LOCKS: dict[str, asyncio.Lock] = {
    "native": asyncio.Lock(),
    "partner": asyncio.Lock(),
}

# How long a merged aggregate and its sort orders sit in Redis, for every job.
# An all-index aggregate is several MB, and a day of them at the partner submit
# budget alone would be ~2 GB, well past what the VM can give Redis. Two hours
# covers someone paging through a result; after that the next read re-merges
# from the job's outputs, which Galaxy keeps, in one collection download.
KMINDEX_AGG_TTL = 2 * CacheTTL.ONE_HOUR

# Finding or creating the history jobs land in is a read-then-write against
# Galaxy, and the id cache below is empty until the first one finishes, so
# without it two first submissions could each find nothing and each create
# one. The lock is per Galaxy account -- the user's sub, or None for the service
# account -- because that's the scope of the race, and bioblend sets no request
# timeout, so one shared lock would let a single hung get_histories hold up every
# account's submissions.
_HISTORY_LOCKS = defaultdict(asyncio.Lock)

# The resolved history id, so a submit doesn't ask Galaxy for it at all. Every
# kmindex submit needs one and the router builds a service per request, so a
# per-instance memo never hit: each submit listed every history on the service
# account, a list that only grows, and on 2026-10-08 that read timed out while
# Galaxy was slow and took submits down with it. Process-wide first, Redis
# behind it so a restart or another worker doesn't go back to Galaxy either.
# Keyed by Galaxy URL, account and history name (see _history_cache_key).
_HISTORY_IDS: Dict[str, str] = {}
HISTORY_ID_CACHE_PREFIX = "galaxy:history_id:v1"
# A user's history is one long-lived history in their own account; a gone one
# is caught on use (_is_missing_history_error), so the TTL only bounds staleness.
HISTORY_ID_TTL = CacheTTL.THIRTY_DAYS
# A service history is only written to on its own UTC day, so a day's grace past
# that is plenty.
SERVICE_HISTORY_ID_TTL = 2 * CacheTTL.ONE_DAY


def _today() -> str:
    """Today's UTC date, which names the day's service history."""
    return datetime.now(timezone.utc).date().isoformat()


# One Galaxy read per cold cache, process-wide, rather than one per miss. The
# router builds a service per request, so the in-flight refresh has to live out
# here, and a deploy or a TTL expiry lands every open search page on the miss
# path at once -- a burst of reads is exactly what Galaxy answers with 429.
# Keyed by cache key, so two Galaxy instances (tests, a re-pointed dev) do not
# share a slot. Holding the task here is also what keeps it from being garbage
# collected mid-read, since the request that started it does not wait for it.
_INDEX_REFRESHES: Dict[str, asyncio.Task] = {}


def _forget_index_refresh(key: str, task: asyncio.Task) -> None:
    """Free the slot once a refresh ends, and surface anything it did not log."""
    if _INDEX_REFRESHES.get(key) is task:
        del _INDEX_REFRESHES[key]
    if not task.cancelled() and task.exception() is not None:
        logger.error("kmindex index refresh failed: %s", task.exception())


async def cancel_kmindex_index_refreshes() -> None:
    """Stop any refresh still reading, before the cache it writes to closes."""
    tasks = list(_INDEX_REFRESHES.values())
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)


# Transport failures worth another try. A dropped connection is the likeliest
# way a long archive stream dies -- partway through iter_content it surfaces as
# ChunkedEncodingError, and an archive cut short without one fails to open as a
# zip -- and giving up on it falls back to the per-shard flood the archive is
# there to avoid.
_RETRYABLE_TRANSPORT_ERRORS = (
    requests.exceptions.Timeout,
    requests.exceptions.ConnectionError,
    requests.exceptions.ChunkedEncodingError,
    zipfile.BadZipFile,
)


def _is_retryable_fetch_error(e: Exception) -> bool:
    """A transport failure or status worth backing off for, on either path."""
    return isinstance(e, _RETRYABLE_TRANSPORT_ERRORS) or (
        isinstance(e, ShardFetchError) and e.status in RETRYABLE_SHARD_STATUSES
    )


def _output_collection_id(job_data: dict) -> Optional[str]:
    """The job's one output collection, or None if it has none or several."""
    collections = [
        c.get("id")
        for c in (job_data.get("output_collections") or {}).values()
        if isinstance(c, dict) and c.get("src") == "hdca"
    ]
    return collections[0] if len(collections) == 1 else None


def _tie_break(accession: str) -> str:
    """
    Stable, archive-neutral ordering key for equal-scoring hits.

    Deterministic across processes and runs, which is what lets the merged list
    be paged coherently and re-aggregated to the same answer.
    """
    return hashlib.md5(accession.encode()).hexdigest()


def _find_kmindex_options(inputs: List[dict]) -> List[str]:
    """Pull the index names out of kmindex_query's nested conditional inputs."""
    for param in inputs:
        if param.get("name") == "kmindex" and param.get("options"):
            return [option[1] for option in param["options"]]
        for case in param.get("cases") or []:
            found = _find_kmindex_options(case.get("inputs", []))
            if found:
                return found
    return []


def _decode_tool_param(value: object) -> object:
    """Decode a parameter Galaxy echoed as JSON, leaving plain text alone."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


def _default_order(sort: str) -> str:
    """Score reads best high to low; text and dates read best A to Z, old to new."""
    return "desc" if sort == "score" else "asc"


def _submitted_index_names(job_params: Optional[dict]) -> Optional[List[str]]:
    """
    The kmindex indexes a job was submitted against, read from its parameters.

    This is the authoritative per-job list -- the tool's current option set says
    what the instance offers today, not what this job searched. Galaxy is loose
    about the shape it echoes back, so accept every form it takes.

    Returns None when the parameters carry no readable selection, and a list --
    possibly empty -- when one was actually parsed. The two must not collapse:
    every hit whose shard matches no name is bucketed as "(unattributed)", so a
    silent [] turns a perfectly good hit list into a 100%-unattributed
    breakdown that the caller would then cache for a day. This is reachable,
    not theoretical -- the tool's db_opts conditional has a second case, and a
    job submitted with db_opts_selector "histdb" (a user-supplied index file)
    carries no kmindex key at all.
    """
    if not isinstance(job_params, dict):
        return None

    # The job is submitted with the flat "db_opts|kmindex" key, but kmindex_query
    # nests that select inside a conditional and Galaxy echoes the conditional
    # back as one JSON-encoded "db_opts" object -- which is what both real probe
    # jobs returned. Try the flat key first, then the nest.
    raw = job_params.get("db_opts|kmindex")
    if raw is None:
        section = _decode_tool_param(job_params.get("db_opts"))
        raw = section.get("kmindex") if isinstance(section, dict) else None
    if raw is None:
        return None

    # A multiple="true" select echoes a list, but one that took a single value
    # can come back as a bare name.
    selection = _decode_tool_param(raw)
    if isinstance(selection, str):
        selection = [selection]
    if not isinstance(selection, list):
        return None
    return [str(name).strip() for name in selection if str(name).strip()]


def _submitted_threshold(job_params: Optional[dict]) -> Optional[float]:
    """
    The threshold a job was run at, read from its echoed parameters.

    kmindex applied it to the raw ratio; Logan's spec applies it to the
    corrected one, so the aggregation re-applies it after subtracting the
    false-positive baseline. Read off the job for the same reason the index
    list is: it answers for this job, not for whatever the form defaults to
    today. None when unreadable or outside 0..1, and the caller keeps the hit
    rather than guess.
    """
    if not isinstance(job_params, dict):
        return None
    raw = _decode_tool_param(job_params.get("threshold"))
    try:
        value = float(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return value if 0.0 <= value <= 1.0 else None


def _index_for_shard(shard_name: str, index_names: List[str]) -> Optional[str]:
    """
    Recover which index a shard key belongs to, longest known name wins.

    kmindex appends a shard number and sometimes a further partition id, and
    not always consistently -- "GENOMIC_BCT_2", "GENOMIC_BCT_10_null" and
    "GENOMIC_BCT_21_0" all came out of one job. Index names contain underscores
    themselves, so splitting on "_" cannot recover the name; only matching
    against the known list can. Longest match wins so a name that prefixes
    another index's name can't claim its shards.
    """
    best: Optional[str] = None
    for name in index_names:
        if shard_name == name or shard_name.startswith(f"{name}_"):
            if best is None or len(name) > len(best):
                best = name
    return best


def _summarize_indexes(
    before: List[dict], after: List[dict], index_names: List[str]
) -> List[dict]:
    """
    Break the hit counts down by index, either side of the cap.

    The cap is one global score sort over the merged list, so an index's share
    of what survives is not its share of what matched, and the shortfall is not
    a simple function of size either. In a real eight-index job the 39 hits from
    METAGENOMIC_UNKNOWN were cut to none at all, while the 1,100,404-hit
    GENOMIC_BCT beside it kept 2.9%. Every submitted index gets a row even when
    it matched nothing, because "the index I added found nothing" and "the index
    I added is missing from the report" read identically otherwise.
    """
    # Resolve per distinct shard, not per hit: a large index is tens of shards
    # but over a million hits.
    attribution = {
        shard: _index_for_shard(shard, index_names) or KMINDEX_UNATTRIBUTED
        for shard in {hit["shard"] for hit in before}
    }
    before_counts = Counter(attribution[hit["shard"]] for hit in before)
    after_counts = Counter(attribution[hit["shard"]] for hit in after)

    totals = {name: 0 for name in index_names}
    totals.update(before_counts)

    return [
        {
            "hits_after_cap": after_counts.get(index, 0),
            "hits_before_cap": count,
            "index": index,
        }
        for index, count in sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))
    ]


class GalaxyService:
    """Service for interacting with Galaxy API using BioBLEND."""

    def __init__(
        self,
        cache: CacheService,
        sra_mirror: Optional[SRAMirrorService] = None,
        credential: Optional[GalaxyCredential] = None,
        history_name: Optional[str] = None,
    ):
        """
        @param history_name: where service-account jobs land, in place of the
            shared "BRC ANALYTICS JOBS"; either way the UTC date is appended.
            Ignored for a user credential, whose jobs always go to their own
            account's history.
        """
        self.cache = cache
        self.history_name = history_name
        self.sra_mirror = sra_mirror
        self.settings = get_settings()

        if credential is None and self.settings.GALAXY_API_KEY:
            # Back-compat construction path (tests, scripts): same behavior as
            # before credentials existed -- the service key from settings.
            credential = GalaxyCredential(
                kind="service", secret=self.settings.GALAXY_API_KEY
            )
        self.credential = credential

        if credential is None:
            logger.warning(
                "No Galaxy credential resolved - Galaxy features will be disabled"
            )
            self._galaxy_available = False
            self.gi = None
        else:
            self._galaxy_available = True
            base_url = self.settings.GALAXY_BASE_URL
            if credential.kind == "user":
                # bioblend sends token as "Authorization: Bearer <token>"
                self.gi = GalaxyInstance(url=base_url, token=credential.secret)
            else:
                self.gi = GalaxyInstance(url=base_url, key=credential.secret)
            self.gi.timeout = GALAXY_REQUEST_TIMEOUT
            # Debug, not info: the router builds one of these per request,
            # status polls included.
            logger.debug(
                "Galaxy service initialized (%s) for URL: %s",
                credential.kind,
                self.settings.GALAXY_API_URL,
            )

        # The cache key the last resolved history id lives under, so a submit
        # that finds the history gone can drop exactly that entry.
        self._history_key: Optional[str] = None

    def is_available(self) -> bool:
        """Check if Galaxy service is available."""
        return self._galaxy_available and self.gi is not None

    def galaxy_login_url(self) -> str:
        """The Galaxy OIDC login URL that links the user's account (302 flow)."""
        base = self.settings.GALAXY_BASE_URL
        return f"{base}/authnz/{self.settings.GALAXY_OIDC_PROVIDER}/login?redirect=true"

    async def submit_job(self, submission: GalaxyJobSubmission) -> GalaxyJobResponse:
        """
        Submit a complete job: upload data and run the random lines tool.

        Returns job ID for tracking the random lines tool execution.
        """
        if not self.is_available():
            raise Exception(
                "Galaxy service not available - check API key configuration"
            )

        logger.info(
            f"Submitting Galaxy job with {len(submission.tabular_data)} chars of data"
        )

        try:
            # Step 0: Get or create the shared BRC Analytics history
            history_id = await self._get_or_create_shared_history()

            # Step 1: Upload the tabular data
            upload_dataset_id = await self._upload_tabular_data(
                submission.tabular_data, submission.filename, history_id
            )

            # Step 2: Run the random lines tool on the uploaded data
            job_id = await self._run_random_lines_tool(
                upload_dataset_id, submission.num_random_lines, history_id
            )

            return GalaxyJobResponse(
                job_id=job_id,
                upload_dataset_id=upload_dataset_id,
                status="submitted",
                message=f"Job {job_id} submitted successfully",
            )

        except Exception as e:
            logger.error(f"Failed to submit Galaxy job: {str(e)}")
            raise Exception(f"Galaxy job submission failed: {str(e)}") from e

    def _index_cache_key(self, prefix: str) -> str:
        """Key the index list on what decides it, not on who is asking.

        The options belong to the tool, so one entry serves every caller, signed
        in or not -- and a re-pointed Galaxy or a bumped tool version gets its
        own entry rather than inheriting the old one's answer.
        """
        return self.cache.make_key(
            prefix,
            {
                "url": self.settings.GALAXY_API_URL,
                "tool": self.settings.GALAXY_KMINDEX_TOOL_ID,
            },
        )

    async def list_kmindex_indexes(self) -> List[str]:
        """List the Logan/kmindex indexes registered on the Galaxy instance.

        Never waits on Galaxy: a miss is answered from the last good list (or
        the shipped names) while a background refresh refills the cache.
        """
        if not self.is_available():
            raise Exception("Galaxy service not available")

        key = self._index_cache_key(KMINDEX_INDEX_CACHE_PREFIX)
        cached = await self.cache.get(key)
        if cached:
            return cached

        if key not in _INDEX_REFRESHES:
            cooldown_key = self._index_cache_key(KMINDEX_INDEX_COOLDOWN_PREFIX)
            if not await self.cache.get(cooldown_key):
                self._start_index_refresh(key)
        return await self._last_known_indexes()

    async def refresh_kmindex_indexes(self) -> List[str]:
        """Read the list from Galaxy now and cache it; [] if Galaxy would not.

        For the boot-time warm, which can afford to wait. Joins a refresh that
        is already running rather than starting a second one, and ignores the
        cooldown: a boot is not part of a burst.
        """
        if not self.is_available():
            raise Exception("Galaxy service not available")
        key = self._index_cache_key(KMINDEX_INDEX_CACHE_PREFIX)
        # Shielded so a cancelled caller does not cancel a refresh other misses
        # are counting on; shutdown cancels it through
        # cancel_kmindex_index_refreshes instead.
        return await asyncio.shield(self._start_index_refresh(key))

    def _start_index_refresh(self, key: str) -> asyncio.Task:
        """The in-flight refresh for this key, started if there is none.

        No await between the check and the insert, so concurrent misses cannot
        both start one. The task keeps this service alive past the request that
        made it, which is safe: it holds the process-wide cache and a bioblend
        client, and nothing closes either when the request ends.
        """
        task = _INDEX_REFRESHES.get(key)
        if task is None or task.done():
            task = asyncio.create_task(self._refresh_index_list(key))
            _INDEX_REFRESHES[key] = task
            task.add_done_callback(lambda t: _forget_index_refresh(key, t))
        return task

    async def _refresh_index_list(self, key: str) -> List[str]:
        """Read the index list from Galaxy and write both cache entries."""
        try:
            indexes = await asyncio.wait_for(
                self._build_kmindex_index_list(), KMINDEX_INDEX_READ_TIMEOUT
            )
        except Exception as e:
            logger.error(f"Failed to list kmindex indexes: {e}")
            indexes = []

        if not indexes:
            # An empty list reads as a search with nothing to search, so it is
            # treated as a failed read rather than cached as an answer.
            await self.cache.set(
                self._index_cache_key(KMINDEX_INDEX_COOLDOWN_PREFIX),
                True,
                KMINDEX_INDEX_COOLDOWN_SECONDS,
            )
            return []

        await self.cache.set(key, indexes, CacheTTL.ONE_DAY)
        await self.cache.set(
            self._index_cache_key(KMINDEX_INDEX_LAST_GOOD_PREFIX),
            indexes,
            CacheTTL.THIRTY_DAYS,
        )
        logger.info("Refreshed the kmindex index list: %d indexes", len(indexes))
        return indexes

    async def _build_kmindex_index_list(self) -> List[str]:
        """Read the index names off the pinned tool's form, uncached."""
        history_id = await self._get_or_create_shared_history()
        tool = await asyncio.to_thread(
            self.gi.tools.build,
            tool_id=self.settings.GALAXY_KMINDEX_TOOL_ID,
            history_id=history_id,
        )
        return _find_kmindex_options(tool.get("inputs", []))

    async def _last_known_indexes(self) -> List[str]:
        """The most recent good answer, or the names shipped with the build."""
        cached = await self.cache.get(
            self._index_cache_key(KMINDEX_INDEX_LAST_GOOD_PREFIX)
        )
        if cached:
            logger.info(
                "No fresh kmindex index list; serving %d from the last good answer",
                len(cached),
            )
            return cached
        logger.warning(
            "No kmindex index list cached at all; serving the %d shipped with "
            "this build",
            len(FALLBACK_INDEX_NAMES),
        )
        return list(FALLBACK_INDEX_NAMES)

    async def submit_kmindex_query(
        self, submission: KmindexQuerySubmission
    ) -> GalaxyJobResponse:
        """Upload a FASTA query and run kmindex against a Logan index."""
        if not self.is_available():
            raise Exception(
                "Galaxy service not available - check API key configuration"
            )

        # The list read never waits on Galaxy, so this costs nothing on the
        # happy path and keeps a typo from leaving an upload behind.
        known = set(await self.list_kmindex_indexes())
        unknown = [name for name in submission.indexes if name not in known]
        if unknown:
            shown = ", ".join(unknown[:5]) + (" ..." if len(unknown) > 5 else "")
            raise KmindexUnknownIndex(f"Unknown index name(s): {shown}")

        # The count, not the names: a search over every index would put ~1.9 KB
        # of index list in the log on every submission.
        logger.info(
            f"Submitting kmindex query against {len(submission.indexes)} "
            f"index(es) ({len(submission.sequence)} chars)"
        )

        tool_requested = False
        try:
            history_id = await self._get_or_create_shared_history()
            try:
                upload_dataset_id = await self._upload_fasta(
                    submission.sequence, submission.filename, history_id
                )
            except Exception as e:
                if not _is_missing_history_error(e):
                    raise
                # Nothing has run yet, so one more go against a freshly
                # resolved history is safe.
                logger.warning(
                    "Cached history %s is gone; resolving it again", history_id
                )
                await self._forget_shared_history()
                history_id = await self._get_or_create_shared_history()
                upload_dataset_id = await self._upload_fasta(
                    submission.sequence, submission.filename, history_id
                )
            tool_requested = True
            try:
                job_id = await self._run_kmindex_query(
                    upload_dataset_id, submission, history_id
                )
            except Exception as e:
                # Not retried: the job may exist. Just stop handing out the id.
                if _is_missing_history_error(e):
                    await self._forget_shared_history()
                raise

            return GalaxyJobResponse(
                job_id=job_id,
                upload_dataset_id=upload_dataset_id,
                status="submitted",
                identity=self.credential.kind if self.credential else None,
                message=(
                    f"kmindex job {job_id} submitted against "
                    f"{len(submission.indexes)} index(es)"
                ),
            )

        except Exception as e:
            if (
                isinstance(e, BioblendConnectionError)
                and getattr(e, "status_code", None) == 401
                and self.credential is not None
                and self.credential.kind == "user"
            ):
                # The body distinguishes "connect your account" from "this
                # token is wrong"; it never contains the token itself.
                logger.warning(
                    "Galaxy returned 401 for the user's bearer token: %s",
                    getattr(e, "body", ""),
                )
                if is_unlinked_account_error(e):
                    raise GalaxyAccountNotLinkedError(self.galaxy_login_url()) from e
            logger.error(f"Failed to submit kmindex query: {str(e)}")
            if not tool_requested:
                raise GalaxySubmitNotStarted(
                    f"kmindex query submission failed: {str(e)}"
                ) from e
            raise Exception(f"kmindex query submission failed: {str(e)}") from e

    def _fetch_shard(self, dataset_id: str) -> bytes:
        """
        One GET for a shard's content.

        bioblend's download_dataset polls show_dataset for an ok state before
        every download, and a retry repeats both -- two requests per shard
        against a Galaxy that is already rate-limiting us. A shard is only read
        once its job is ok, so the state check buys nothing.

        @param dataset_id: the shard's dataset.
        @returns: the raw content.
        """
        r = self.gi.make_get_request(
            f"{self.gi.url}/datasets/{dataset_id}/display",
            params={"preview": "false"},
        )
        if r.status_code != 200:
            raise ShardFetchError(r.status_code, f"{dataset_id}: {r.text[:200]}")
        return r.content

    async def _download_shard(
        self, dataset_id: str, semaphore: asyncio.Semaphore
    ) -> Optional[dict]:
        """Download one shard's JSON, backing off when Galaxy rate-limits us."""
        delay = KMINDEX_BACKOFF_SECONDS
        for attempt in range(KMINDEX_DOWNLOAD_ATTEMPTS):
            try:
                async with semaphore:
                    content = await asyncio.to_thread(self._fetch_shard, dataset_id)
                return json.loads(content)
            except Exception as e:
                # Sleep outside the semaphore so a backing-off task doesn't
                # hold a slot the other shards could be using. A gateway error is
                # as transient as a rate limit, and a shard given up on is a
                # hole in the hit list until the hourly re-aggregation.
                if (
                    not _is_retryable_fetch_error(e)
                    or attempt == KMINDEX_DOWNLOAD_ATTEMPTS - 1
                ):
                    logger.warning(f"Shard {dataset_id} download failed: {e}")
                    return None
                await asyncio.sleep(
                    delay * (1 + random.random() * KMINDEX_BACKOFF_JITTER)
                )
                delay *= 2
        return None

    async def get_kmindex_results(
        self,
        job_id: str,
        limit: int = 100,
        offset: int = 0,
        sort: KmindexSort = "score",
        order: Optional[KmindexOrder] = None,
        lane: AggregationLane = "native",
    ) -> KmindexResults:
        """Merge a kmindex job's per-shard outputs into one ranked hit list.

        @param lane: whose aggregation lock a cold merge takes. The native lane
            waits its turn, as it always has; the partner lane answers
            GalaxyJobAggregating instead of waiting, because its callers poll
            and a connection parked behind another partner merge is one the
            proxy will cut anyway.
        """
        if not self.is_available():
            raise Exception("Galaxy service not available")

        aggregate = await self._load_aggregate(job_id, lane)

        ordering, sort, order = await self._ordering_for(
            aggregate, job_id, sort, order or _default_order(sort)
        )
        # Single exit, so a cache hit can't skip annotation -- an earlier
        # version returned straight from the pre-lock hit and silently served
        # every warm request unannotated.
        return await self._annotate_with_sra(
            self._page_kmindex(
                aggregate,
                job_id,
                limit,
                offset,
                ordering=ordering,
                sort=sort,
                order=order,
            )
        )

    async def _load_aggregate(
        self, job_id: str, lane: AggregationLane = "native"
    ) -> dict:
        """The job's cached aggregate, merging its shards first on a miss.

        Shared by the listing and the filtered reads, so a filtered link opened
        after the aggregate expired re-aggregates too -- which rewrites the
        export the filter runs over.

        @param job_id: the kmindex job.
        @param lane: whose aggregation lock a cold merge takes.
        @returns: the aggregate.
        """
        cache_key = self._agg_cache_key(job_id)
        aggregate = await self.cache.get(cache_key)

        if aggregate is None:
            # Someone else is already merging this job. Say so rather than
            # queue on the lock behind them: the caller can ask again, and a
            # connection parked for the length of a 2,869-shard merge is one
            # the proxy will cut before the answer exists.
            marker_key = self._aggregating_key(job_id)
            if await self.cache.get(marker_key):
                raise GalaxyJobAggregating(
                    f"Results for job {job_id} are still being merged"
                )

            # Serialize aggregation within the lane. Without this, several
            # callers landing on a cold cache each pull every shard at once,
            # which multiplies the load Galaxy is already rate-limiting and
            # leaves them racing to overwrite the same cache entry with partial
            # results.
            lock = _AGGREGATION_LOCKS[lane]
            # No await between this check and the acquire below, so on one event
            # loop a free lock is still free when async-with takes it.
            if lane == "partner" and lock.locked():
                raise GalaxyJobAggregating(
                    f"Results for job {job_id} are queued behind another merge"
                )
            async with lock:
                # Re-check: whoever held the lock may have just built it.
                aggregate = await self.cache.get(cache_key)
                if aggregate is None:
                    # The lane lock only serializes its own lane, and the check
                    # above races, so the job itself is claimed atomically: one
                    # merge per job across both lanes, and whoever loses is told
                    # to come back rather than merging it a second time.
                    if not await self.cache.claim(marker_key, CacheTTL.ONE_HOUR):
                        raise GalaxyJobAggregating(
                            f"Results for job {job_id} are still being merged"
                        )
                    try:
                        # Re-check once more under the claim: the other lane can
                        # finish, cache its result and drop the marker between
                        # our miss above and this claim, and merging again then
                        # repeats the downloads -- and a second pass that loses
                        # shards would overwrite a complete result with a
                        # partial one.
                        aggregate = await self.cache.get(cache_key)
                        if aggregate is None:
                            aggregate = await self._aggregate_shards(job_id)
                    finally:
                        await self.cache.delete(marker_key)
        return aggregate

    async def _filterable_export(self, aggregate: dict, job_id: str) -> Path:
        """The export a filtered read runs over, or why there is none.

        @param aggregate: the job's aggregate.
        @param job_id: the kmindex job.
        @returns: the path of a current export.
        @raises KmindexFiltersUnavailable: with a reason the UI can show.
        """
        export = self._export_state(aggregate, job_id)
        if export["status"] == EXPORT_TOO_LARGE:
            raise KmindexFiltersUnavailable(
                "Filtering needs the full match set on disk, and this search "
                "matched too many runs for one to be prepared."
            )
        path = export_file_path(self.settings.KMINDEX_EXPORT_DIR, job_id)
        current = False
        if export["status"] == EXPORT_AVAILABLE and path is not None:
            try:
                current = await asyncio.to_thread(export_is_current, path)
            except Exception as e:
                logger.warning(f"kmindex job {job_id}: unreadable export: {e}")
        if not current:
            raise KmindexFiltersUnavailable(
                "Filtering needs the full match set on disk, and it is not "
                "available for this search right now."
            )
        return path

    async def get_filtered_kmindex_results(
        self,
        job_id: str,
        filters: KmindexFilters,
        limit: int = 100,
        offset: int = 0,
        sort: KmindexSort = "score",
        order: Optional[KmindexOrder] = None,
    ) -> KmindexResults:
        """A page of the filtered match set, served from the export parquet.

        Filters every matched row, not the top 50,000, then caps what can be
        paged at KMINDEX_MAX_HITS the way the listing is, keeping the true
        count in filtered_matches; the filtered export stays uncapped. Needs
        neither Redis beyond the aggregate nor the mirror: rows in the file
        already carry their metadata. BioSample is the exception, read from the mirror
        when it can answer, since the export has no such column.

        @param job_id: the kmindex job.
        @param filters: a non-empty filter.
        @param limit: page size.
        @param offset: rows to skip.
        @param sort: column to order by.
        @param order: direction, defaulting as the listing does.
        @returns: the page, with filtered=True.
        @raises KmindexFiltersUnavailable: when there is no current export.
        """
        if not self.is_available():
            raise Exception("Galaxy service not available")
        aggregate = await self._load_aggregate(job_id)
        path = await self._filterable_export(aggregate, job_id)
        order = order or _default_order(sort)
        page = await asyncio.to_thread(
            kmindex_filters.subset_page,
            path,
            filters,
            limit,
            offset,
            sort,
            order,
            KMINDEX_MAX_HITS,
        )
        matched = page["matched"]
        export = self._export_state(aggregate, job_id)
        hits = [KmindexHit(**h) for h in page["hits"]]
        await self._fill_biosample(hits)
        return KmindexResults(
            job_id=job_id,
            query_name=aggregate.get("query_name"),
            total_hits=min(matched, KMINDEX_MAX_HITS),
            total_matches=aggregate["total_matches"],
            filtered_matches=matched,
            shards_failed=aggregate.get("shards_failed", 0),
            shards_searched=aggregate.get("shards_searched", 0),
            shards_with_hits=aggregate.get("shards_with_hits", 0),
            truncated=matched > KMINDEX_MAX_HITS,
            # The cap here is one rank cut over the filtered rows, not the
            # merge's cut across indexes, so per-index accounting has nothing
            # to say about it.
            per_index=[],
            cohort=aggregate.get("cohort"),
            geography=aggregate.get("geography"),
            export_bytes=export["bytes"],
            export_rows=export["rows"],
            export_status=export["status"],
            limit=limit,
            offset=offset,
            sort=sort,
            order=order,
            sra_mirror_available=True,
            sra_annotated=sum(1 for hit in hits if hit.sra is not None),
            filtered=True,
            hits=hits,
        )

    async def get_filtered_kmindex_summary(
        self, job_id: str, filters: KmindexFilters
    ) -> KmindexSummary:
        """The filtered cohort and geography, shaped as the unfiltered ones.

        @param job_id: the kmindex job.
        @param filters: the filter; an empty one summarizes the whole file.
        @returns: the summary.
        @raises KmindexFiltersUnavailable: when there is no current export.
        """
        if not self.is_available():
            raise Exception("Galaxy service not available")
        aggregate = await self._load_aggregate(job_id)
        path = await self._filterable_export(aggregate, job_id)
        summary = await asyncio.to_thread(kmindex_filters.subset_summary, path, filters)
        return KmindexSummary(
            cohort=summary["cohort"],
            geography=summary["geography"],
            matched=summary["matched"],
            total_matches=aggregate["total_matches"],
        )

    async def get_cached_kmindex_results(
        self, job_id: str, limit: int = 25, offset: int = 0
    ) -> Optional[KmindexResults]:
        """Page a job's aggregate if -- and only if -- it is already cached.

        The assistant's read path. get_kmindex_results builds the aggregate on
        a miss, which pulls every shard from Galaxy under the process-wide
        lock and takes over a minute cold; a chat turn has 110 seconds and a
        tool call far less. So this never aggregates: a miss is None and the
        caller sends the user to the results page, which does.

        Needs no Galaxy connection -- paging a cached aggregate is Redis plus
        the mirror -- so it is deliberately not gated on is_available().
        """
        cache_key = self._agg_cache_key(job_id)
        aggregate = await self.cache.get(cache_key)
        if aggregate is None:
            return None
        return await self._annotate_with_sra(
            self._page_kmindex(aggregate, job_id, limit, offset)
        )

    def _agg_cache_key(self, job_id: str) -> str:
        """Where a job's aggregate lives, for the mirror we are serving from.

        The mirror's capability set is part of the key, not just of the value.
        A capability the mirror cannot serve is skipped rather than attempted,
        and the result is a steady state worth caching for the full TTL -- correct
        while the process runs, because a file cannot grow a column underneath
        it. But the whole point of the per-capability check is the window
        where the backend is deployed ahead of a mirror rebuild, and that
        window ends with a restart onto a wider file. Keyed on job id alone,
        every aggregate computed during the window would keep serving without
        geography for the rest of its TTL after the mirror that has it is live.

        Folding the fingerprint in makes that restart a clean miss instead: one
        re-aggregation per job at the moment the capability set actually
        changes, and full-day caching either side of it. The alternative --
        shortening the TTL whenever a capability was skipped -- would pay an
        hourly re-aggregation for the entire deploy-ahead window rather than
        one at the end of it, which is the cost the one-hour TTL exists to
        bound in the first place.

        @param job_id: the kmindex job.
        @returns: the cache key.
        """
        fingerprint = (
            self.sra_mirror.capability_fingerprint() if self.sra_mirror else "none"
        )
        return self.cache.make_key(
            KMINDEX_AGG_CACHE_PREFIX, {"job_id": job_id, "mirror": fingerprint}
        )

    def _aggregating_key(self, job_id: str) -> str:
        """Where the marker saying this job is mid-merge lives.

        @param job_id: the kmindex job.
        @returns: the cache key.
        """
        return self.cache.make_key(KMINDEX_AGGREGATING_PREFIX, {"job_id": job_id})

    async def _ordering_for(
        self,
        aggregate: dict,
        job_id: str,
        sort: KmindexSort,
        order: KmindexOrder,
    ) -> Tuple[Optional[List[int]], KmindexSort, KmindexOrder]:
        """
        How to walk the listed hits for a sort, and which sort that turned out
        to be.

        Returns (ordering, sort, order). `ordering` is a permutation of hit
        positions, or None for the stored order, which is score descending.
        The sort and order come back because they can change: a metadata sort
        needs the mirror, and when the mirror cannot answer the page is served
        in score order and says so, rather than 500ing or pretending.
        """
        hits = aggregate["hits"]
        descending = order == "desc"
        if sort == "score":
            return (
                (None if descending else list(range(len(hits) - 1, -1, -1))),
                sort,
                order,
            )
        if sort == "accession":
            # reverse=True keeps ties in listing order, which is score rank.
            return (
                sorted(
                    range(len(hits)),
                    key=lambda i: hits[i]["accession"],
                    reverse=descending,
                ),
                sort,
                order,
            )
        if not self._mirror_can(CAPABILITY_ANNOTATION):
            return None, "score", "desc"

        # A permutation only fits the listing it was built over, and the listing
        # under one job id can change while a two-hour permutation is still
        # cached: a partial aggregate lives an hour, and the one that replaces
        # it can hold different accessions at the same length -- both capped at
        # KMINDEX_MAX_HITS, say. A length check can't see that, and the stale
        # permutation would silently misorder every page, so the listing itself
        # goes in the key.
        listing = hashlib.sha256(
            "\n".join(h["accession"] for h in hits).encode()
        ).hexdigest()
        key = self.cache.make_key(
            KMINDEX_ORDER_CACHE_PREFIX,
            {
                "job_id": job_id,
                "listing": listing,
                "mirror": self.sra_mirror.capability_fingerprint(),
                "order": order,
                "sort": sort,
            },
        )
        cached = await self.cache.get(key)
        if cached is not None:
            return list(cached), sort, order
        try:
            ordering = await asyncio.to_thread(
                self.sra_mirror.order_hits, hits, sort, descending
            )
        except ValueError as e:
            # order_hits only raises this for a column it has no expression
            # for, which means KmindexSort and _SORTABLE_COLUMNS have drifted:
            # the header stays clickable and never lights up, and every request
            # for it silently serves score order. That is a bug in this repo
            # rather than a mirror having a bad day, so it is louder.
            logger.error(
                f"kmindex job {job_id}: {sort} is an accepted sort but the "
                f"mirror cannot order by it; serving score order: {e}"
            )
            return None, "score", "desc"
        except Exception as e:
            # A sort is a convenience on top of the listing; the listing must
            # still come back.
            logger.warning(f"kmindex job {job_id}: could not order by {sort}: {e}")
            return None, "score", "desc"
        await self.cache.set(key, ordering, KMINDEX_AGG_TTL)
        return ordering, sort, order

    def _mirror_can(self, capability: str) -> bool:
        """Whether the mirror can answer for one serving path.

        Narrower than is_available on purpose. The mirror is copied to the
        host out of band, so the backend routinely runs against a file older
        than itself; asking per capability keeps a query that is ahead of the
        file from taking the rest of the mirror down with it, and turns what
        used to be a per-request exception into one startup warning.
        """
        return bool(
            self.sra_mirror
            and self.sra_mirror.is_available()
            and self.sra_mirror.has_capability(capability)
        )

    async def _fill_biosample(self, hits: List[KmindexHit]) -> None:
        """
        Carry BioSample onto a filtered page from the mirror.

        The export predates the biosample column, so a page read from it has
        none, and the BioSample column would go blank the moment a filter is
        applied. Best effort, like annotation: the page is correct without it.
        """
        wanted = [hit.accession for hit in hits if hit.sra is not None]
        if not wanted or not (
            self._mirror_can(CAPABILITY_ANNOTATION)
            and self._mirror_can(CAPABILITY_BIOSAMPLE)
        ):
            return
        try:
            by_accession = await asyncio.to_thread(
                self.sra_mirror.runs_by_accession, wanted
            )
        except Exception as e:
            logger.warning(f"BioSample lookup for a filtered page failed: {e}")
            return
        for hit in hits:
            metadata = by_accession.get(hit.accession)
            if hit.sra is not None and metadata:
                hit.sra.biosample = metadata.get("biosample")

    async def _annotate_with_sra(self, results: KmindexResults) -> KmindexResults:
        """
        Join SRA mirror metadata onto the hits on this page.

        Only the current page is annotated -- a query can match tens of
        thousands of accessions, and nobody needs metadata for the ones they
        aren't looking at. Misses are left as None and should be rare: the
        mirror holds every SRA run as of its build, so a miss is a run newer
        than the mirror or one SRA has no run record for.
        """
        if not self._mirror_can(CAPABILITY_ANNOTATION):
            return results

        try:
            by_accession = await asyncio.to_thread(
                self.sra_mirror.runs_by_accession,
                [hit.accession for hit in results.hits],
            )
        except Exception as e:
            # Annotation is additive; a mirror problem shouldn't cost the
            # caller their search results.
            logger.warning(f"SRA annotation failed: {e}")
            return results

        results.sra_mirror_available = True
        for hit in results.hits:
            metadata = by_accession.get(hit.accession)
            if metadata:
                hit.sra = SraRunMetadata(**metadata)
                results.sra_annotated += 1
        return results

    async def _cohort_for(
        self, job_id: str, hits: List[dict]
    ) -> Tuple[Optional[dict], bool]:
        """
        Count and facet the complete hit set against the SRA mirror.

        Returns (cohort, failed). The flag separates a mirror that isn't
        configured -- a steady state, where retrying changes nothing and the
        result is safe to cache without a cohort -- from a read that broke,
        which must not be cached, because the pre-cap hit list it would have
        been computed from stops existing when aggregation returns.

        Runs in a worker thread: the mirror is sync DuckDB, and this query
        takes about a second on a million-hit job, which is far too long to
        spend on the event loop.
        """
        if not self._mirror_can(CAPABILITY_COHORT):
            return None, False

        try:
            cohort = await asyncio.to_thread(
                self.sra_mirror.cohort_for_accessions,
                [hit["accession"] for hit in hits],
            )
        except Exception as e:
            # Nothing is salvaged from a failed read. The cohort is the number
            # every other count in the response is measured against, so a
            # partially-filled one would undermine exactly what it exists for.
            logger.warning(f"kmindex job {job_id}: cohort query failed: {e}")
            return None, True
        return cohort, False

    async def _geography_for(
        self, job_id: str, hits: List[dict]
    ) -> Tuple[Optional[dict], bool]:
        """
        Roll up where the complete hit set was sampled from.

        Third call in the same window as the cohort and the export, for the
        same reason: after this the hits are capped at 50,000 and the other
        million are only recoverable by re-downloading every shard from a
        rate-limited Galaxy.

        Returns (geography, failed) on the cohort's contract. A mirror that
        cannot answer -- unconfigured, or a file predating the columns this
        needs -- is a steady state the aggregate is safe to cache without;
        a read that started and broke is not, because it would freeze a map
        that is only missing by accident.

        Hits rather than accessions, because the point layer colours by score
        and the score exists only on the hit. Whether the mirror can answer
        for coordinates at all is decided inside the query, one capability
        down: a file older than schema_version 6 still returns its countries.

        @param job_id: the job being aggregated, for the log line.
        @param hits: every hit, before the cap.
        @returns: the geography payload, and whether the read failed.
        """
        if not self._mirror_can(CAPABILITY_GEOGRAPHY):
            return None, False

        try:
            geography = await asyncio.to_thread(
                self.sra_mirror.geography_for_hits, hits
            )
        except Exception as e:
            # Nothing partial is salvaged, for the cohort's reason: the
            # denominator beside the map is the number that makes the map
            # honest, and a half-filled one is worse than no map.
            logger.warning(f"kmindex job {job_id}: geography query failed: {e}")
            return None, True
        return geography, False

    async def _export_for(
        self, job_id: str, hits: List[dict]
    ) -> Tuple[Optional[dict], bool]:
        """
        Materialize the complete hit set, enriched, so it can be downloaded.

        Same window and the same reason as _cohort_for: the pre-cap list is
        alive here and nowhere else. Once aggregation returns, the aggregate
        holds 50,000 hits with no metadata on them, so rebuilding the full
        enriched set would mean re-downloading every shard from a rate-limited
        Galaxy behind the process-wide lock.

        Additive, so it cannot cost anyone their search: a write that fails
        leaves the results correct and simply without a download. Returns
        (record, failed) for the same reason _cohort_for does -- an unconfigured
        export is a steady state worth caching for the full TTL, a broken write
        is not.

        @param job_id: the job being aggregated; names the file.
        @param hits: every hit, before the cap, in ranked order.
        @returns: the export record to store on the aggregate, and whether the
            write failed.
        """
        export_dir = self.settings.KMINDEX_EXPORT_DIR
        if not export_dir or not self._mirror_can(CAPABILITY_EXPORT):
            return None, False

        try:
            record = await asyncio.to_thread(
                self.sra_mirror.export_hits, job_id, hits, export_dir
            )
        except Exception as e:
            logger.warning(f"kmindex job {job_id}: export materialization failed: {e}")
            return None, True
        return record, False

    async def _download_collection(
        self, job_id: str, status: GalaxyJobStatus
    ) -> Optional[List[Optional[dict]]]:
        """
        Every shard in one request, from the job's output collection as a zip.

        One GET per shard is thousands of requests for an all-index search, and
        Galaxy rate-limits us well before that. Galaxy streams the archive, so a
        big one does not trip the read timeout.

        @param job_id: the job, for logging.
        @param status: the job's status, carrying its outputs and collection.
        @returns: the parsed shards, or None to fall back to per-shard
            downloads -- no collection, a download that kept failing, or an
            archive whose member count does not match the job's outputs.
        """
        if not status.output_collection_id:
            return None
        delay = KMINDEX_BACKOFF_SECONDS
        for attempt in range(KMINDEX_COLLECTION_ATTEMPTS):
            try:
                shards = await asyncio.to_thread(
                    self._fetch_collection, status.output_collection_id
                )
            except Exception as e:
                if (
                    not _is_retryable_fetch_error(e)
                    or attempt == KMINDEX_COLLECTION_ATTEMPTS - 1
                ):
                    logger.warning(
                        f"kmindex job {job_id}: collection download failed, "
                        f"falling back to per-shard downloads: {e}"
                    )
                    return None
                await asyncio.sleep(
                    delay * (1 + random.random() * KMINDEX_BACKOFF_JITTER)
                )
                delay *= 2
                continue
            if len(shards) != len(status.outputs):
                # Not knowing which outputs are missing, a short archive can't be
                # patched shard by shard -- and merging it anyway would report
                # the gap as "no hits" rather than as failed shards.
                logger.warning(
                    f"kmindex job {job_id}: collection held {len(shards)} shards "
                    f"but the job has {len(status.outputs)} outputs; falling back "
                    "to per-shard downloads"
                )
                return None
            return shards
        return None

    def _fetch_collection(self, collection_id: str) -> List[Optional[dict]]:
        """
        Download a collection's zip to a temp file and parse each member.

        @param collection_id: the HDCA.
        @returns: one parsed shard per member, None for a member that isn't
            valid JSON (counted as a failed shard, as a failed download is).
        """
        r = self.gi.make_get_request(
            f"{self.gi.url}/dataset_collections/{collection_id}/download",
            stream=True,
        )
        try:
            if r.status_code != 200:
                raise ShardFetchError(
                    r.status_code, f"collection {collection_id}: {r.text[:200]}"
                )
            with tempfile.TemporaryFile() as archive:
                for chunk in r.iter_content(chunk_size=1 << 20):
                    archive.write(chunk)
                archive.seek(0)
                shards: List[Optional[dict]] = []
                with zipfile.ZipFile(archive) as z:
                    for member in z.infolist():
                        # Shards are the .json members; anything else Galaxy
                        # adds to the archive would inflate the count and
                        # force the per-shard fallback for nothing.
                        if member.is_dir() or not member.filename.endswith(".json"):
                            continue
                        try:
                            shards.append(json.loads(z.read(member)))
                        except ValueError:
                            logger.warning(
                                f"collection {collection_id}: {member.filename} "
                                "is not valid JSON"
                            )
                            shards.append(None)
                return shards
        finally:
            r.close()

    async def _download_each_shard(
        self, job_id: str, status: GalaxyJobStatus
    ) -> List[Optional[dict]]:
        """
        One GET per shard, then a slower sweep for the ones that failed.

        @param job_id: the job, for logging.
        @param status: the job's status, carrying its outputs.
        @returns: one parsed shard per output, None where the download failed.
        """
        semaphore = asyncio.Semaphore(KMINDEX_MAX_CONCURRENT_DOWNLOADS)
        shards = list(
            await asyncio.gather(
                *(self._download_shard(o.dataset.id, semaphore) for o in status.outputs)
            )
        )

        # Second pass for stragglers. The rate limiter is bursty, so a handful
        # of shards can exhaust their budget while the rest sail through --
        # letting the pressure drop and retrying just those one at a time
        # recovers them without making every shard wait on a longer budget.
        stragglers = [i for i, shard in enumerate(shards) if shard is None]
        if stragglers:
            logger.info(
                f"kmindex job {job_id}: retrying {len(stragglers)} shards after "
                f"a {KMINDEX_RETRY_SWEEP_DELAY}s cooldown"
            )
            await asyncio.sleep(KMINDEX_RETRY_SWEEP_DELAY)
            single = asyncio.Semaphore(1)
            recovered = await asyncio.gather(
                *(
                    self._download_shard(status.outputs[i].dataset.id, single)
                    for i in stragglers
                )
            )
            for index, shard in zip(stragglers, recovered):
                shards[index] = shard

        return shards

    async def _aggregate_shards(self, job_id: str) -> dict:
        """Download and merge every shard for a completed kmindex job."""
        cache_key = self._agg_cache_key(job_id)

        status = await self.get_job_status(job_id)
        if not status.is_complete:
            raise GalaxyJobNotComplete(
                f"Job {job_id} is not yet complete (state: {status.state})"
            )
        if not status.is_successful:
            raise GalaxyJobFailed(f"Job {job_id} failed with state: {status.state}")
        if not status.outputs:
            # A successful kmindex job always writes at least one shard, so no
            # outputs means we failed to read them rather than that the query
            # matched nothing. Refuse rather than cache an empty result.
            raise Exception(
                f"Job {job_id} reported success but exposed no output datasets"
            )

        # Read the job's parameters up front. They carry the submitted index
        # list, which attributes the shard keys, and the threshold the job ran
        # at, which is re-applied to the corrected scores; one fetch serves
        # both, so neither can end up thinking the parameters were readable
        # while the other did not. Taking it before the downloads keeps the
        # round trip off the span where both the full and the capped hit list
        # are alive. get_job_status already fetched the job dict this comes out
        # of, so on a cold read it is handed over rather than fetched again.
        params = await self._job_params(job_id, status.params)
        submitted_indexes = _submitted_index_names(params)
        threshold = _submitted_threshold(params)

        shards = await self._download_collection(job_id, status)
        if shards is None:
            shards = await self._download_each_shard(job_id, status)

        hits: List[dict] = []
        query_name = None
        shards_with_hits = 0
        shards_failed = 0
        corrected_out = 0
        for shard in shards:
            if not shard:
                shards_failed += 1
                continue
            # Shape is {shard_name: {query_name: {accession: score}}}.
            shard_had_hits = False
            for shard_name, queries in shard.items():
                for name, accessions in (queries or {}).items():
                    query_name = query_name or name
                    for accession, raw_score in (accessions or {}).items():
                        # Logan's own site subtracts a false-positive baseline
                        # for 227 saturated samples and re-applies the
                        # threshold to what is left. kmindex applied it to the
                        # raw ratio, so a hit that only cleared it because its
                        # Bloom filter matches everything is dropped here.
                        score, baseline = correct_score(accession, raw_score)
                        hit = {
                            "accession": accession,
                            "score": score,
                            "shard": shard_name,
                        }
                        if baseline is not None:
                            if threshold is not None and score < threshold:
                                corrected_out += 1
                                continue
                            hit["fp_correction"] = baseline
                        # Count the shard, not the (shard, query) pair -- the
                        # latter can exceed shards_searched. Counted on the
                        # kept hit, so a shard whose only matches were dropped
                        # saturated samples reports no hits rather than one.
                        shard_had_hits = True
                        hits.append(hit)
            if shard_had_hits:
                shards_with_hits += 1

        if corrected_out:
            logger.info(
                f"kmindex job {job_id}: dropped {corrected_out} hits that fell "
                f"under the {threshold} threshold once their false-positive "
                "baseline was subtracted"
            )

        # Sort on more than score: ties are common, and shards land in completion
        # order, so score alone leaves equal-scoring hits free to reshuffle
        # between aggregations and make paged offsets incoherent.
        #
        # The second key has to be a hash rather than the accession itself. Ties
        # are not a rare edge here -- a conserved query returns them by the
        # hundred thousand (a 16S fragment at threshold 0.5 gave 305,061 hits
        # scoring exactly 1.0 against a 50,000 cap), so the cap boundary sits
        # inside one tie band and the tie-break alone decides the whole result
        # set. Accession order is archive-prefix order, and the prefix predicts
        # the submitting country: DRR is DDBJ, ERR is ENA, SRR is NCBI. Sorting
        # by accession returned zero SRR rows out of a true 65.1%, so the
        # country column reported a distribution manufactured by the sort.
        # md5 reproduces the real composition to within 0.2 points.
        hits.sort(key=lambda h: (-h["score"], _tie_break(h["accession"])))

        # Count before capping. The true match count is the number the caller
        # needs to judge the answer -- a 16S fragment matched 1,133,516
        # accessions against this 50,000 cap, and reporting only the cap
        # presents 4% of the result as the whole of it.
        total_matches = len(hits)

        # Summarize the whole match set before anything is thrown away. The
        # cap is a global score sort, so counting what survives it counts the
        # cap: on this job's real 1,133,516 hits the surviving 50,000 put
        # E. coli first at 70.2% and left Salmonella enterica -- the true
        # leader at 29.2% -- out of the top five entirely, with 947 of 10,927
        # organisms and 3,894 of 19,014 BioProjects still represented. Done
        # here, while the full list is the only one alive, so the peak is one
        # hit list rather than two plus a summary.
        cohort, cohort_failed = await self._cohort_for(job_id, hits)

        # Where those runs came from, off the same list and in the same
        # window. Separate from the cohort's country facet because that one
        # lists a head of ten -- 42 countries rendered as ten bars on the
        # reference job -- and a choropleth needs all of them.
        geography, geography_failed = await self._geography_for(job_id, hits)

        # Written from the same list, in the same window, for the same reason:
        # the capped list below has no metadata on it and is 4% of this one.
        export, export_failed = await self._export_for(job_id, hits)

        truncated = total_matches > KMINDEX_MAX_HITS
        capped = hits
        if truncated:
            logger.warning(
                f"kmindex job {job_id} returned {total_matches} hits; "
                f"capping at {KMINDEX_MAX_HITS}"
            )
            capped = hits[:KMINDEX_MAX_HITS]
        per_index = _summarize_indexes(hits, capped, submitted_indexes or [])
        hits = capped

        unattributed = next(
            (s for s in per_index if s["index"] == KMINDEX_UNATTRIBUTED), None
        )
        if unattributed:
            logger.warning(
                f"kmindex job {job_id}: {unattributed['hits_before_cap']} hits "
                "could not be attributed to a known index"
            )

        aggregate = {
            "cohort": cohort,
            # What was materialized, not what can be served: the file can be
            # swept or the volume reset while this entry still claims it, so
            # _page_kmindex checks the disk before advertising a download.
            "export": export,
            "geography": geography,
            "hits": hits,
            "per_index": per_index,
            "query_name": query_name,
            "shards_failed": shards_failed,
            "shards_searched": len(shards),
            "shards_with_hits": shards_with_hits,
            "total_matches": total_matches,
            "truncated": truncated,
        }

        # A dropped shard means missing accessions, and a hit count that looks
        # authoritative while being wrong is worse than a slow answer -- so the
        # missing shards are worth another attempt, but not on every request.
        # A search over every index is 2,869 downloads, and repeating all of
        # them for one lost shard serializes every other cold fetch behind the
        # lock while the reader waits. Keep the partial for an hour instead:
        # one re-aggregation per hour rather than one per request, a transient
        # failure still heals on its own, and the results page says how many
        # shards are missing while it stands. An unreadable index list is a
        # different case and still refuses the cache: hours of "(unattributed)"
        # parked beside a perfectly good hit list has no way to refresh itself.
        if shards_failed:
            ttl = CacheTTL.ONE_HOUR
            logger.error(
                f"kmindex job {job_id}: {shards_failed}/{len(shards)} shards "
                f"failed to download; returning a partial result cached for {ttl}s"
            )
            await self.cache.set(cache_key, aggregate, ttl)
        elif submitted_indexes is None:
            logger.error(
                f"kmindex job {job_id}: submitted index list unreadable; "
                "returning an unattributed breakdown uncached"
            )
        elif not submitted_indexes and total_matches:
            # Parsed, but empty: every shard key then attributes to nothing and
            # the breakdown is 100% "(unattributed)" -- the same unrefreshable
            # state as an unreadable list, so it gets the same refusal. Only a
            # hit list with something in it can land here; an empty one has
            # nothing to misattribute.
            logger.error(
                f"kmindex job {job_id}: submitted index list parsed as empty "
                f"but {total_matches} hits matched; returning an unattributed "
                "breakdown uncached"
            )
        else:
            # A failed cohort read deliberately does NOT veto the cache. Every
            # refusal above is about the hit list itself being wrong; the
            # cohort is an optional enrichment over a hit list that is correct,
            # and letting it block the cache inverts the cost. Re-aggregation
            # is 84-280 shard downloads from a rate-limited Galaxy behind a
            # process-wide lock, and the failure need not be transient.
            #
            # The cause that produced this TTL -- a mirror on an older schema
            # reporting available and raising on every call, so every results
            # poll and every page click re-downloaded every shard -- no longer
            # reaches here: _initialize now checks the columns each capability
            # names, and a mirror that cannot answer is skipped rather than
            # attempted (see _mirror_can and _agg_cache_key). What is left is
            # the genuinely unpredictable: a corrupt page, a revoked handle, a
            # duckdb disagreement. A short TTL bounds the retry instead of
            # removing it -- one re-aggregation per hour rather than one per
            # request, and a transient failure still heals on its own. The
            # export is treated identically and for the same reason: it can
            # only be written while the full hit list is alive, so caching a
            # failed one for the full TTL means no download for that long.
            ttl = KMINDEX_AGG_TTL
            degraded = [
                name
                for name, failed in (
                    ("cohort query", cohort_failed),
                    ("geography query", geography_failed),
                    ("export materialization", export_failed),
                )
                if failed
            ]
            if degraded:
                ttl = CacheTTL.ONE_HOUR
                logger.error(
                    f"kmindex job {job_id}: {' and '.join(degraded)} failed; "
                    f"returning the hit list without, cached for {ttl}s so the "
                    "work is retried rather than repeated on every request"
                )
            await self.cache.set(cache_key, aggregate, ttl)

        return aggregate

    async def _job_params(
        self, job_id: str, params: Optional[dict] = None
    ) -> Optional[dict]:
        """
        The job's echoed tool parameters, fetching them when the caller has none.

        GalaxyJobStatus drops params on the way into the status cache, so a
        status read after the job completed -- which is every read the results
        page makes, since it polls status to completion first -- arrives with
        none. One show_job here serves both the index list and the threshold,
        which used to be read separately and disagree about whether the job's
        parameters were readable at all.

        The job's own echoed parameters rather than the tool's option list:
        building that form needs a history, and the history lookup's error path
        creates one per call, which would have a read-only results request
        writing to Galaxy. These are read-only, cannot be poisoned by an
        unrelated lookup failing, and answer for this job rather than for
        whatever the instance offers today.

        @param job_id: the job whose parameters to read.
        @param params: parameters the caller already holds. Passing them avoids
            a show_job round trip per cold results request -- and with it a
            metadata call that has no retry budget, unlike the seven attempts
            plus straggler sweep every shard download gets, and whose failure
            used to discard the whole aggregation. None means "not carried", so
            fall back to fetching.
        @returns: the params dict, or None if they could not be read.
        """
        if params is not None:
            return params
        try:
            job = await asyncio.to_thread(self.gi.jobs.show_job, job_id)
        except Exception as e:
            logger.warning(f"kmindex job {job_id}: could not read job parameters: {e}")
            return None
        params = job.get("params") if isinstance(job, dict) else None
        return params if isinstance(params, dict) else None

    def _export_state(self, aggregate: dict, job_id: str) -> dict:
        """
        What the response may say about downloading this job's full match set.

        The aggregate is cached for KMINDEX_AGG_TTL; the file it describes is not.
        Retention sweeps it and a redeployed volume loses every export at once,
        so the cached record is a claim and the filesystem is the authority --
        an "available" with no file behind it is downgraded here rather than
        handed to the UI as a link that 404s. It costs one stat per page
        request, and that stat also supplies the size, so the UI can say how
        big the download is without a second round trip.

        A stat can only answer "is there a file, and how big" -- it does not
        open the parquet, so a file that exists but is corrupt still reports
        available and 404s on download. The write path cannot produce one, so
        that is external damage; the empty case is caught below because it is
        the one shape a stat can recognise.

        @param aggregate: the cached aggregate.
        @param job_id: the job being paged.
        @returns: status, size in bytes and row count, shaped for
            KmindexResults' export_ fields.
        """
        record = aggregate.get("export") or {}
        status = record.get("status", EXPORT_UNAVAILABLE)
        # An entry written by another version of this code is not worth a 500;
        # the honest reading of a status we don't recognise is "no download".
        if status not in (EXPORT_AVAILABLE, EXPORT_TOO_LARGE):
            status = EXPORT_UNAVAILABLE
        absent = {"bytes": None, "rows": None, "status": status}
        if status != EXPORT_AVAILABLE:
            return absent

        path = export_file_path(self.settings.KMINDEX_EXPORT_DIR, job_id)
        try:
            # is_file() as well as stat(): a directory would answer a size and
            # then fail the download.
            size = path.stat().st_size if path is not None and path.is_file() else None
        except OSError:
            size = None
        # A zero-byte file is the one unreadable state this stat can see. It
        # cannot be produced by the write path -- that renames into place and
        # unlinks a failed COPY -- so it means external damage, and offering two
        # download buttons over it would 404 both for as long as the aggregate
        # is cached.
        if size == 0:
            size = None
        if size is None:
            logger.info(
                f"kmindex job {job_id}: cached aggregate claims an export but "
                "no file is on disk; reporting no download"
            )
            return {**absent, "status": EXPORT_UNAVAILABLE}
        return {"bytes": size, "rows": record.get("rows"), "status": EXPORT_AVAILABLE}

    def _page_kmindex(
        self,
        aggregate: dict,
        job_id: str,
        limit: int,
        offset: int,
        ordering: Optional[List[int]] = None,
        sort: KmindexSort = "score",
        order: KmindexOrder = "desc",
    ) -> KmindexResults:
        """Slice a cached aggregate into a page of results, in the given order."""
        hits = aggregate["hits"]
        if ordering is None:
            page = hits[offset : offset + limit]
        else:
            page = [hits[i] for i in ordering[offset : offset + limit]]
        export = self._export_state(aggregate, job_id)
        return KmindexResults(
            job_id=job_id,
            query_name=aggregate.get("query_name"),
            # total_hits is what's pageable, so it stays post-cap; total_matches
            # carries the true count. Neither is defaulted: the cache key is
            # versioned, so an entry written before these keys existed reads as
            # a miss and is recomputed, rather than being filled in with the
            # post-cap count and rendered as "50,000 matched, none missing".
            total_hits=len(hits),
            total_matches=aggregate["total_matches"],
            shards_failed=aggregate.get("shards_failed", 0),
            shards_searched=aggregate.get("shards_searched", 0),
            shards_with_hits=aggregate.get("shards_with_hits", 0),
            truncated=aggregate.get("truncated", False),
            per_index=aggregate["per_index"],
            # Absent on an aggregate cached before cohorts existed, and on one
            # built while the mirror was unavailable. Absent is the honest
            # answer in both cases: there is no partial cohort to render.
            cohort=aggregate.get("cohort"),
            # Same posture, and the cache prefix went to v3 so a pre-geography
            # entry reads as a miss rather than as a cohort with no geography.
            geography=aggregate.get("geography"),
            export_bytes=export["bytes"],
            export_rows=export["rows"],
            export_status=export["status"],
            limit=limit,
            offset=offset,
            sort=sort,
            order=order,
            hits=[KmindexHit(**h) for h in page],
        )

    async def get_job_status(self, job_id: str) -> GalaxyJobStatus:
        """Get the current status of a Galaxy job using BioBLEND."""
        if not self.is_available():
            raise Exception("Galaxy service not available")

        # Check cache first
        cache_key = self.cache.make_key("galaxy:job_status", {"job_id": job_id})
        cached_status = await self.cache.get(cache_key)

        # A settled entry lives an hour; anything else was written with the
        # short live TTL, so finding it at all means it is fresh enough.
        if cached_status:
            return GalaxyJobStatus(**cached_status)

        try:
            # bioblend is synchronous, so every call goes through a thread --
            # this backend also serves the assistant and MCP, and blocking the
            # event loop on a Galaxy round-trip stalls all of them.
            job_data = await asyncio.to_thread(self.gi.jobs.show_job, job_id)
            # Debug, not info: every open search polls this every three
            # seconds, and the job dict carries the tool's parameters.
            logger.debug("Galaxy job %s full response: %s", job_id, job_data)

            state = job_data["state"]
            status = GalaxyJobStatus(
                job_id=job_id,
                state=state,
                created_time=job_data["create_time"],
                updated_time=job_data["update_time"],
                is_complete=state in TERMINAL_JOB_STATES,
                is_successful=state == GalaxyJobState.OK,
                stdout=job_data.get("stdout"),
                stderr=job_data.get("stderr"),
                exit_code=job_data.get("exit_code"),
                # Carried for in-process callers (see the field's comment);
                # excluded from both the response and the cached model_dump.
                params=job_data.get("params"),
            )

            logger.debug(
                "Galaxy job %s state: %s, complete: %s, successful: %s",
                job_id,
                state,
                status.is_complete,
                status.is_successful,
            )

            # Only a successful job's outputs are ever read. Hand over the job
            # dict already fetched above rather than making _get_job_outputs
            # re-fetch it.
            if status.is_successful:
                status.outputs = await self._get_job_outputs(job_id, job_data)
                status.output_collection_id = _output_collection_id(job_data)
            if state in SETTLED_JOB_STATES:
                await self.cache.set(cache_key, status.model_dump(), CacheTTL.ONE_HOUR)
            else:
                await self.cache.set(
                    cache_key, status.model_dump(), LIVE_JOB_STATUS_TTL
                )

            return status

        except BioblendConnectionError as e:
            if is_missing_job_error(e):
                raise GalaxyJobNotFound(f"No Galaxy job {job_id}") from e
            logger.error(f"BioBLEND error getting job status: {e}")
            raise Exception(f"Failed to get job status using BioBLEND: {str(e)}") from e
        except Exception as e:
            logger.error(f"BioBLEND error getting job status: {e}")
            raise Exception(f"Failed to get job status using BioBLEND: {str(e)}") from e

    async def get_job_results(self, job_id: str) -> GalaxyJobResult:
        """Get the complete results from a finished Galaxy job."""
        if not self.is_available():
            raise Exception("Galaxy service not available")

        # Check cache first
        cache_key = self.cache.make_key("galaxy:job_results", {"job_id": job_id})
        cached_results = await self.cache.get(cache_key)
        if cached_results:
            return GalaxyJobResult(**cached_results)

        try:
            # Get job status first
            status = await self.get_job_status(job_id)

            if not status.is_complete:
                raise GalaxyJobNotComplete(
                    f"Job {job_id} is not yet complete (state: {status.state})"
                )

            if not status.is_successful:
                raise GalaxyJobFailed(f"Job {job_id} failed with state: {status.state}")

            # Get output contents
            results = {}
            for output in status.outputs:
                try:
                    content = await self._get_dataset_content(output.dataset.id)
                    results[output.name] = content
                except Exception as e:
                    logger.warning(
                        f"Failed to get content for output {output.name}: {e}"
                    )
                    results[output.name] = f"Error retrieving content: {str(e)}"

            # Create result object
            result = GalaxyJobResult(
                job_id=job_id,
                status=status.state,
                outputs=status.outputs,
                results=results,
                created_time=status.created_time,
                completed_time=status.updated_time,
            )

            # Cache results for 24 hours
            await self.cache.set(cache_key, result.model_dump(), CacheTTL.ONE_DAY)
            return result

        except (GalaxyJobNotComplete, GalaxyJobFailed, GalaxyJobNotFound):
            # What the job did (or that there is no such job), not a failure
            # to ask; the wrapper below would
            # flatten both back into the "Failed to ..." message the API layer
            # used to have to guess at.
            raise
        except Exception as e:
            logger.error(f"Error getting job results: {e}")
            raise Exception(f"Failed to get job results: {str(e)}") from e

    async def _upload_tabular_data(
        self, data: str, filename: str, history_id: str
    ) -> str:
        """Upload tabular data to Galaxy using BioBLEND and return dataset ID."""
        try:
            # Use BioBLEND's paste_content method for uploading text data
            upload_result = await asyncio.to_thread(
                self.gi.tools.paste_content,
                content=data,
                history_id=history_id,
                file_name=filename,
                file_type="tabular",
            )

            logger.info(f"BioBLEND upload response: {upload_result}")

            # Get the output dataset ID from the outputs
            outputs = upload_result.get("outputs", [])
            if not outputs:
                raise Exception("No outputs returned from BioBLEND upload")

            dataset_id = outputs[0]["id"]
            logger.info(f"Uploaded data to dataset: {dataset_id} using BioBLEND")
            return dataset_id

        except Exception as e:
            logger.error(f"BioBLEND upload failed: {e}")
            raise Exception(f"Failed to upload data using BioBLEND: {str(e)}") from e

    async def _upload_fasta(self, sequence: str, filename: str, history_id: str) -> str:
        """Upload a FASTA query sequence and return the dataset ID."""
        try:
            upload_result = await asyncio.to_thread(
                self.gi.tools.paste_content,
                content=sequence,
                history_id=history_id,
                file_name=filename,
                file_type="fasta",
            )

            outputs = upload_result.get("outputs", [])
            if not outputs:
                raise Exception("No outputs returned from FASTA upload")

            dataset_id = outputs[0]["id"]
            logger.info(f"Uploaded FASTA query to dataset: {dataset_id}")
            return dataset_id

        except Exception as e:
            logger.error(f"FASTA upload failed: {e}")
            raise Exception(f"Failed to upload FASTA query: {str(e)}") from e

    async def _run_kmindex_query(
        self, input_dataset_id: str, submission: KmindexQuerySubmission, history_id: str
    ) -> str:
        """Run kmindex_query against one or more Logan indexes, returning the job ID."""
        try:
            # Conditional params must use flattened "cond|param" keys. The nested
            # dict form is accepted but silently drops the inner select, which
            # runs kmindex with --index '' and fails on the node.
            tool_inputs = {
                "db_opts|db_opts_selector": "db",
                # multiple="true" on the tool's select, so this takes the list as-is;
                # a bare string would be read as a single index name.
                "db_opts|kmindex": submission.indexes,
                "fastx": {"src": "hda", "id": input_dataset_id},
                "format": "json",
                "threshold": submission.threshold,
                "zvalue": submission.zvalue,
            }

            tool_response = await asyncio.to_thread(
                self.gi.tools.run_tool,
                history_id=history_id,
                tool_id=self.settings.GALAXY_KMINDEX_TOOL_ID,
                tool_inputs=tool_inputs,
            )

            jobs = tool_response.get("jobs", [])
            if not jobs:
                raise Exception("No jobs returned from kmindex tool execution")

            job_id = jobs[0]["id"]
            logger.info(
                f"Started kmindex query job {job_id} against "
                f"{', '.join(submission.indexes)}"
            )
            return job_id

        except Exception as e:
            logger.error(f"kmindex tool execution failed: {e}")
            raise Exception(f"Failed to run kmindex query: {str(e)}") from e

    async def _run_random_lines_tool(
        self, input_dataset_id: str, num_lines: int, history_id: str
    ) -> str:
        """Run the random lines tool using BioBLEND and return job ID."""
        try:
            tool_inputs = {
                "input": {"src": "hda", "id": input_dataset_id},
                "num_lines": str(num_lines),
                "seed_source|seed_source_selector": "no_seed",
            }

            # Use BioBLEND to run the tool
            tool_response = await asyncio.to_thread(
                self.gi.tools.run_tool,
                history_id=history_id,
                tool_id=self.settings.GALAXY_RANDOM_LINES_TOOL_ID,
                tool_inputs=tool_inputs,
            )

            logger.info(f"BioBLEND tool response: {tool_response}")

            # Get the job ID
            jobs = tool_response.get("jobs", [])
            if not jobs:
                raise Exception("No jobs returned from BioBLEND tool execution")

            job_id = jobs[0]["id"]
            logger.info(f"Started random lines tool with BioBLEND job ID: {job_id}")
            return job_id

        except Exception as e:
            logger.error(f"BioBLEND tool execution failed: {e}")
            raise Exception(
                f"Failed to run random lines tool using BioBLEND: {str(e)}"
            ) from e

    async def _get_job_outputs(
        self, job_id: str, job_details: Optional[dict] = None
    ) -> List[GalaxyJobOutput]:
        """
        Get output information for a job using BioBLEND.

        @param job_id: the job whose outputs to read.
        @param job_details: an already-fetched job dict. Callers that just
            fetched one pass it in; re-fetching is a second identical GET
            against a rate-limited Galaxy for a dict we already hold.
        @returns: one entry per output dataset.
        """
        try:
            if job_details is None:
                job_details = await asyncio.to_thread(self.gi.jobs.show_job, job_id)

            # Built from the job dict alone. A show_dataset per output was one
            # serial GET per shard -- thousands for an all-index search -- fired
            # on the poll that first sees the job finish. Galaxy 429'd partway
            # through, the status 500'd uncached, and the next poll restarted
            # the burst, so a finished job could never be read. Nothing reads
            # the extra fields; the id is all a shard download needs.
            return [
                GalaxyJobOutput(
                    id=output_data["id"],
                    name=output_name,
                    dataset=GalaxyDataset(id=output_data["id"], name=output_name),
                )
                for output_name, output_data in job_details.get("outputs", {}).items()
            ]

        except Exception as e:
            # Never degrade to an empty list here. A kmindex job's outputs ARE
            # its results, so "we couldn't read them" and "there weren't any"
            # are indistinguishable downstream -- and the caller would go on to
            # cache the empty set for a day as a complete, zero-hit answer.
            logger.error(f"BioBLEND error getting job outputs for {job_id}: {e}")
            raise Exception(f"Failed to get outputs for job {job_id}: {str(e)}") from e

    async def _get_dataset_content(self, dataset_id: str) -> str:
        """Get the actual content of a dataset using BioBLEND."""
        try:
            # Use BioBLEND to download dataset content
            content = await asyncio.to_thread(
                self.gi.datasets.download_dataset, dataset_id
            )
            if isinstance(content, bytes):
                return content.decode("utf-8")
            return str(content)

        except Exception as e:
            logger.error(f"BioBLEND error getting dataset content: {e}")
            return f"Error retrieving dataset content: {str(e)}"

    def _history_target(self) -> Tuple[str, object, int]:
        """The history jobs land in: its name, its lock's account, its TTL.

        Service-account jobs go to a "BRC ANALYTICS JOBS - <UTC date>" history
        (or history_name's, if the service was built with one); a signed-in
        user's jobs go to a single "BRC Logan Search" history in their own
        account -- the bearer token scopes the lookup and create_history to
        that user.

        Service histories turn over daily because every search adds an upload
        and a collection of one dataset per index shard -- thousands for an
        all-index search -- so one history would grow without end.
        """
        if self.credential is not None and self.credential.kind == "user":
            return "BRC Logan Search", self.credential.user_sub, HISTORY_ID_TTL
        name = f"{self.history_name or 'BRC ANALYTICS JOBS'} - {_today()}"
        # Keyed by name too: two service histories on one account are separate
        # find-or-creates, and must not wait on each other.
        return name, ("service", name), SERVICE_HISTORY_ID_TTL

    def _history_cache_key(self, account: object, name: str) -> Optional[str]:
        """Where the resolved id is cached, or None when it must not be.

        A user credential without a sub can't be told apart from another one,
        so its history is looked up every time rather than risk handing one
        user's history id to another.
        """
        if account is None:
            return None
        return self.cache.make_key(
            HISTORY_ID_CACHE_PREFIX,
            {
                "account": list(account) if isinstance(account, tuple) else account,
                "name": name,
                "url": self.settings.GALAXY_API_URL,
            },
        )

    async def _get_or_create_shared_history(self) -> str:
        """Find or create the history jobs land in, from cache when possible.

        Raises rather than inventing a stand-in history: a failure here is
        before anything ran, so the submit is safe to retry, and a timestamped
        stray per failure only made the account's history list longer.
        """
        name, account, ttl = self._history_target()
        key = self._history_cache_key(account, name)
        self._history_key = key

        cached = await self._cached_history_id(key)
        if cached:
            return cached

        async with _HISTORY_LOCKS[account]:
            # Whoever held the lock may have just resolved it.
            cached = await self._cached_history_id(key)
            if cached:
                return cached

            try:
                history_id = await asyncio.to_thread(self._find_history, name)
                if history_id:
                    logger.info(f"Using existing shared history: {history_id} ({name})")
                else:
                    logger.info(f"Creating new shared history: {name}")
                    new_history = await asyncio.to_thread(
                        self.gi.histories.create_history, name=name
                    )
                    history_id = new_history["id"]
                    logger.info(f"Created shared history: {history_id} ({name})")
            except Exception as e:
                # An unlinked user's 401 has to travel intact to the
                # connect-prompt mapping, so this re-raises as is.
                logger.error(f"Error getting or creating shared history: {e}")
                raise

            if key:
                _HISTORY_IDS[key] = history_id
                await self.cache.set(key, history_id, ttl)
            return history_id

    async def _cached_history_id(self, key: Optional[str]) -> Optional[str]:
        """The cached id under key, from this process or else from Redis."""
        if not key:
            return None
        history_id = _HISTORY_IDS.get(key)
        if history_id:
            return history_id
        history_id = await self.cache.get(key)
        if history_id:
            _HISTORY_IDS[key] = history_id
        return history_id

    async def _forget_shared_history(self) -> None:
        """Drop the cached id, so the next resolve goes back to Galaxy."""
        key = self._history_key
        if not key:
            return
        _HISTORY_IDS.pop(key, None)
        await self.cache.delete(key)

    def _find_history(self, name: str) -> Optional[str]:
        """The id of this account's live history called name, if there is one.

        bioblend's get_histories(name=...) lists every history and filters
        client-side, which is the read that timed out; Galaxy's q/qv filter
        does it server-side. The name is re-checked here anyway, so a Galaxy
        that ignored the filter would be slow rather than wrong.
        """
        r = self.gi.make_get_request(
            f"{self.gi.url}/histories",
            params={
                "keys": "id,name,update_time",
                "q": ["name", "deleted"],
                "qv": [name, "False"],
            },
        )
        if r.status_code != 200:
            raise BioblendConnectionError(
                f"History lookup failed with status {r.status_code}",
                body=r.text,
                status_code=r.status_code,
            )
        matches = [h for h in r.json() if h.get("name") == name]
        if not matches:
            return None
        # Several only if someone made one by hand; the busiest is the one
        # jobs have been going to.
        return max(matches, key=lambda h: h.get("update_time") or "")["id"]
