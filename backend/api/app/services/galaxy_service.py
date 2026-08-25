"""Galaxy API integration service using BioBLEND."""

import asyncio
import hashlib
import json
import logging
import random
import time
from collections import Counter
from typing import List, Optional, Tuple

from bioblend.galaxy import GalaxyInstance

from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings
from app.core.galaxy_credential import GalaxyCredential
from app.models.galaxy import (
    GalaxyDataset,
    GalaxyJobOutput,
    GalaxyJobResponse,
    GalaxyJobResult,
    GalaxyJobState,
    GalaxyJobStatus,
    GalaxyJobSubmission,
    KmindexHit,
    KmindexQuerySubmission,
    KmindexResults,
    SraRunMetadata,
)
from app.services.sra_mirror import (
    EXPORT_AVAILABLE,
    EXPORT_TOO_LARGE,
    EXPORT_UNAVAILABLE,
    SRAMirrorService,
    export_file_path,
)

logger = logging.getLogger(__name__)

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
KMINDEX_AGG_CACHE_PREFIX = "galaxy:kmindex_agg:v2"

# Aggregation is process-wide serialized: it is I/O bound against a service that
# rate-limits us, so overlapping runs make each other slower and can each end up
# with a different partial view of the same job.
_AGGREGATION_LOCK = asyncio.Lock()


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
    ):
        self.cache = cache
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
            base_url = self.settings.GALAXY_API_URL.replace(
                "/api", ""
            )  # BioBLEND expects base URL without /api
            if credential.kind == "user":
                # bioblend sends token as "Authorization: Bearer <token>"
                self.gi = GalaxyInstance(url=base_url, token=credential.secret)
            else:
                self.gi = GalaxyInstance(url=base_url, key=credential.secret)
            logger.info(
                f"Galaxy service initialized ({credential.kind}) for URL: "
                f"{self.settings.GALAXY_API_URL}"
            )

        # Memoized per instance, so a history id never leaks across requests/users.
        self._shared_history_id = None

    def is_available(self) -> bool:
        """Check if Galaxy service is available."""
        return self._galaxy_available and self.gi is not None

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

    async def list_kmindex_indexes(self, history_id: str = None) -> List[str]:
        """List the Logan/kmindex indexes registered on the Galaxy instance."""
        if not self.is_available():
            raise Exception("Galaxy service not available")

        history_id = history_id or await self._get_or_create_shared_history()
        try:
            tool = await asyncio.to_thread(
                self.gi.tools.build,
                tool_id=self.settings.GALAXY_KMINDEX_TOOL_ID,
                history_id=history_id,
            )
            return _find_kmindex_options(tool.get("inputs", []))
        except Exception as e:
            logger.error(f"Failed to list kmindex indexes: {e}")
            raise Exception(f"Failed to list kmindex indexes: {str(e)}") from e

    async def submit_kmindex_query(
        self, submission: KmindexQuerySubmission
    ) -> GalaxyJobResponse:
        """Upload a FASTA query and run kmindex against a Logan index."""
        if not self.is_available():
            raise Exception(
                "Galaxy service not available - check API key configuration"
            )

        logger.info(
            f"Submitting kmindex query against {', '.join(submission.indexes)} "
            f"({len(submission.sequence)} chars)"
        )

        try:
            history_id = await self._get_or_create_shared_history()
            upload_dataset_id = await self._upload_fasta(
                submission.sequence, submission.filename, history_id
            )
            job_id = await self._run_kmindex_query(
                upload_dataset_id, submission, history_id
            )

            return GalaxyJobResponse(
                job_id=job_id,
                upload_dataset_id=upload_dataset_id,
                status="submitted",
                message=(
                    f"kmindex job {job_id} submitted against "
                    f"{len(submission.indexes)} index(es)"
                ),
            )

        except Exception as e:
            logger.error(f"Failed to submit kmindex query: {str(e)}")
            raise Exception(f"kmindex query submission failed: {str(e)}") from e

    async def _download_shard(
        self, dataset_id: str, semaphore: asyncio.Semaphore
    ) -> Optional[dict]:
        """Download one shard's JSON, backing off when Galaxy rate-limits us."""
        delay = KMINDEX_BACKOFF_SECONDS
        for attempt in range(KMINDEX_DOWNLOAD_ATTEMPTS):
            try:
                async with semaphore:
                    content = await asyncio.to_thread(
                        self.gi.datasets.download_dataset, dataset_id
                    )
                if isinstance(content, bytes):
                    content = content.decode("utf-8")
                return json.loads(content)
            except Exception as e:
                # Sleep outside the semaphore so a backing-off task doesn't
                # hold a slot the other shards could be using.
                is_rate_limit = "429" in str(e)
                if not is_rate_limit or attempt == KMINDEX_DOWNLOAD_ATTEMPTS - 1:
                    logger.warning(f"Shard {dataset_id} download failed: {e}")
                    return None
                await asyncio.sleep(
                    delay * (1 + random.random() * KMINDEX_BACKOFF_JITTER)
                )
                delay *= 2
        return None

    async def get_kmindex_results(
        self, job_id: str, limit: int = 100, offset: int = 0
    ) -> KmindexResults:
        """Merge a kmindex job's per-shard outputs into one ranked hit list."""
        if not self.is_available():
            raise Exception("Galaxy service not available")

        cache_key = self.cache.make_key(KMINDEX_AGG_CACHE_PREFIX, {"job_id": job_id})
        aggregate = await self.cache.get(cache_key)

        if aggregate is None:
            # Serialize aggregation across the whole process. Without this,
            # several callers landing on a cold cache each pull every shard at
            # once, which multiplies the load Galaxy is already rate-limiting
            # and leaves them racing to overwrite the same cache entry with
            # partial results.
            async with _AGGREGATION_LOCK:
                # Re-check: whoever held the lock may have just built it.
                aggregate = await self.cache.get(cache_key)
                if aggregate is None:
                    aggregate = await self._aggregate_shards(job_id)

        # Single exit, so a cache hit can't skip annotation -- an earlier
        # version returned straight from the pre-lock hit and silently served
        # every warm request unannotated.
        return await self._annotate_with_sra(
            self._page_kmindex(aggregate, job_id, limit, offset)
        )

    async def _annotate_with_sra(self, results: KmindexResults) -> KmindexResults:
        """
        Join SRA mirror metadata onto the hits on this page.

        Only the current page is annotated -- a query can match tens of
        thousands of accessions, and nobody needs metadata for the ones they
        aren't looking at. Misses are expected and left as None: the mirror
        covers BRC-relevant organisms, while Logan indexes all of SRA.
        """
        if not self.sra_mirror or not self.sra_mirror.is_available():
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
        if not self.sra_mirror or not self.sra_mirror.is_available():
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
        export is a steady state worth caching for a day, a broken write is not.

        @param job_id: the job being aggregated; names the file.
        @param hits: every hit, before the cap, in ranked order.
        @returns: the export record to store on the aggregate, and whether the
            write failed.
        """
        export_dir = self.settings.KMINDEX_EXPORT_DIR
        if not export_dir or not self.sra_mirror or not self.sra_mirror.is_available():
            return None, False

        try:
            record = await asyncio.to_thread(
                self.sra_mirror.export_hits, job_id, hits, export_dir
            )
        except Exception as e:
            logger.warning(f"kmindex job {job_id}: export materialization failed: {e}")
            return None, True
        return record, False

    async def _aggregate_shards(self, job_id: str) -> dict:
        """Download and merge every shard for a completed kmindex job."""
        cache_key = self.cache.make_key(KMINDEX_AGG_CACHE_PREFIX, {"job_id": job_id})

        status = await self.get_job_status(job_id)
        if not status.is_complete:
            raise Exception(f"Job {job_id} is not yet complete (state: {status.state})")
        if not status.is_successful:
            raise Exception(f"Job {job_id} failed with state: {status.state}")
        if not status.outputs:
            # A successful kmindex job always writes at least one shard, so no
            # outputs means we failed to read them rather than that the query
            # matched nothing. Refuse rather than cache an empty result.
            raise Exception(
                f"Job {job_id} reported success but exposed no output datasets"
            )

        # Read the submitted index list up front. It is what attributes the
        # shard keys, and taking it before the downloads keeps the round trip
        # off the span where both the full and the capped hit list are alive.
        # get_job_status already fetched the job dict this comes out of, so on
        # a cold read it is handed over rather than fetched again.
        submitted_indexes = await self._submitted_indexes(job_id, status.params)

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

        hits: List[dict] = []
        query_name = None
        shards_with_hits = 0
        shards_failed = 0
        for shard in shards:
            if not shard:
                shards_failed += 1
                continue
            # Shape is {shard_name: {query_name: {accession: score}}}.
            shard_had_hits = False
            for shard_name, queries in shard.items():
                for name, accessions in (queries or {}).items():
                    query_name = query_name or name
                    if accessions:
                        # Count the shard, not the (shard, query) pair -- the
                        # latter can exceed shards_searched.
                        shard_had_hits = True
                    for accession, score in accessions.items():
                        hits.append(
                            {
                                "accession": accession,
                                "score": score,
                                "shard": shard_name,
                            }
                        )
            if shard_had_hits:
                shards_with_hits += 1

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
        # authoritative while being wrong is worse than a slow answer. Report it,
        # and don't cache it -- the next request gets a clean attempt. An
        # unreadable index list gets the same treatment: a day of
        # "(unattributed)" parked beside a perfectly good hit list has no way to
        # refresh itself.
        if shards_failed:
            logger.error(
                f"kmindex job {job_id}: {shards_failed}/{len(shards)} shards "
                "failed to download; returning a partial result uncached"
            )
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
            # process-wide lock, and the failure need not be transient:
            # is_available() only checks that a connection exists and
            # _initialize never validates the columns this query needs, so a
            # mirror on an older schema reports available and raises every
            # time -- which made every results poll and every page click
            # re-download every shard, forever. A short TTL bounds the retry
            # instead of removing it: one re-aggregation per hour rather than
            # one per request, and a genuinely transient failure still heals
            # on its own. The export is treated identically and for the same
            # reason: it can only be written while the full hit list is alive,
            # so caching a failed one for a day means no download for a day.
            ttl = CacheTTL.ONE_DAY
            degraded = [
                name
                for name, failed in (
                    ("cohort query", cohort_failed),
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

    async def _submitted_indexes(
        self, job_id: str, params: Optional[dict] = None
    ) -> Optional[List[str]]:
        """
        The index names this job was submitted against, or None if unreadable.

        Deliberately not the tool's option list: building that form needs a
        history, and the history lookup's error path creates one per call, which
        would have a read-only results request writing to Galaxy. The job's own
        parameters are read-only, cannot be poisoned by an unrelated lookup
        failing, and answer for this job rather than for whatever the instance
        offers today.

        @param job_id: the job whose parameters to read.
        @param params: parameters already fetched by the caller. Passing them
            avoids a third show_job round trip per cold results request -- and
            with it a metadata call that has no retry budget, unlike the seven
            attempts plus straggler sweep every shard download gets, and whose
            failure used to discard the whole aggregation. None means "not
            carried", so fall back to fetching.
        @returns: the parsed index names, or None if they could not be read.
        """
        if params is None:
            try:
                job = await asyncio.to_thread(self.gi.jobs.show_job, job_id)
                params = job.get("params")
            except Exception as e:
                logger.warning(
                    f"kmindex job {job_id}: could not read the submitted "
                    f"index list: {e}"
                )
                return None
        return _submitted_index_names(params)

    def _export_state(self, aggregate: dict, job_id: str) -> dict:
        """
        What the response may say about downloading this job's full match set.

        The aggregate is cached for a day; the file it describes is not.
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
        self, aggregate: dict, job_id: str, limit: int, offset: int
    ) -> KmindexResults:
        """Slice a cached aggregate into a page of results."""
        hits = aggregate["hits"]
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
            export_bytes=export["bytes"],
            export_rows=export["rows"],
            export_status=export["status"],
            limit=limit,
            offset=offset,
            hits=[KmindexHit(**h) for h in hits[offset : offset + limit]],
        )

    async def get_job_status(self, job_id: str) -> GalaxyJobStatus:
        """Get the current status of a Galaxy job using BioBLEND."""
        if not self.is_available():
            raise Exception("Galaxy service not available")

        # Check cache first
        cache_key = self.cache.make_key("galaxy:job_status", {"job_id": job_id})
        cached_status = await self.cache.get(cache_key)

        if cached_status and cached_status.get("state") in ["ok", "error"]:
            # Job is complete, return cached result
            return GalaxyJobStatus(**cached_status)

        try:
            # bioblend is synchronous, so every call goes through a thread --
            # this backend also serves the assistant and MCP, and blocking the
            # event loop on a Galaxy round-trip stalls all of them.
            job_data = await asyncio.to_thread(self.gi.jobs.show_job, job_id)

            # Debug: log the full job data response
            logger.info(f"BioBLEND job {job_id} full response: {job_data}")

            # Parse job status
            status = GalaxyJobStatus(
                job_id=job_id,
                state=GalaxyJobState(job_data["state"]),
                created_time=job_data["create_time"],
                updated_time=job_data["update_time"],
                is_complete=job_data["state"] in ["ok", "error", "deleted"],
                is_successful=job_data["state"] == "ok",
                stdout=job_data.get("stdout"),
                stderr=job_data.get("stderr"),
                exit_code=job_data.get("exit_code"),
                # Carried for in-process callers (see the field's comment);
                # excluded from both the response and the cached model_dump.
                params=job_data.get("params"),
            )

            # Debug: log state changes
            logger.info(
                f"BioBLEND Job {job_id} current state: {job_data['state']}, "
                f"complete: {status.is_complete}, successful: {status.is_successful}"
            )

            # If job is complete, get outputs. Hand over the job dict already
            # fetched above rather than making _get_job_outputs re-fetch it.
            if status.is_complete:
                status.outputs = await self._get_job_outputs(job_id, job_data)
                # Cache completed job status for 1 hour
                await self.cache.set(cache_key, status.model_dump(), CacheTTL.ONE_HOUR)

            return status

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
                raise Exception(
                    f"Job {job_id} is not yet complete (state: {status.state})"
                )

            if not status.is_successful:
                raise Exception(f"Job {job_id} failed with state: {status.state}")

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
            # Get job outputs using BioBLEND
            if job_details is None:
                job_details = await asyncio.to_thread(self.gi.jobs.show_job, job_id)
            outputs = []

            # Get outputs from job details
            job_outputs = job_details.get("outputs", {})

            for output_name, output_data in job_outputs.items():
                # Get dataset details using BioBLEND
                dataset_details = await asyncio.to_thread(
                    self.gi.datasets.show_dataset, output_data["id"]
                )

                dataset_info = GalaxyDataset(
                    id=dataset_details["id"],
                    name=dataset_details["name"],
                    state=dataset_details["state"],
                    file_ext=dataset_details.get("file_ext", "txt"),
                    file_size=dataset_details.get("file_size"),
                    created_time=dataset_details.get("created_time"),
                    updated_time=dataset_details.get("updated_time"),
                )

                output = GalaxyJobOutput(
                    id=dataset_details["id"], name=output_name, dataset=dataset_info
                )
                outputs.append(output)

            return outputs

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

    async def _get_or_create_shared_history(self) -> str:
        """Find or create the history jobs land in.

        Service-account jobs share one "BRC ANALYTICS JOBS" history; a signed-in
        user's jobs go to a "BRC Logan Search" history in their own account --
        the bearer token scopes get_histories()/create_history to that user.
        """
        if self.credential is not None and self.credential.kind == "user":
            shared_history_name = "BRC Logan Search"
        else:
            shared_history_name = "BRC ANALYTICS JOBS"

        if self._shared_history_id:
            return self._shared_history_id

        try:
            # Get all histories using BioBLEND
            histories = await asyncio.to_thread(self.gi.histories.get_histories)

            # Look for existing shared history
            for history in histories:
                if history.get("name") == shared_history_name:
                    history_id = history["id"]
                    logger.info(
                        "Using existing shared history: "
                        f"{history_id} ({shared_history_name})"
                    )
                    self._shared_history_id = history_id
                    return history_id

            # If we get here, the shared history doesn't exist, so create it
            logger.info(f"Creating new shared history: {shared_history_name}")
            new_history = await asyncio.to_thread(
                self.gi.histories.create_history, name=shared_history_name
            )
            history_id = new_history["id"]
            logger.info(f"Created shared history: {history_id} ({shared_history_name})")
            self._shared_history_id = history_id
            return history_id

        except Exception as e:
            logger.error(f"Error getting or creating shared history: {e}")
            # Fallback to creating a new history with timestamp
            fallback_name = f"{shared_history_name} - {int(time.time())}"
            logger.warning(f"Falling back to creating history: {fallback_name}")
            fallback_history = await asyncio.to_thread(
                self.gi.histories.create_history, name=fallback_name
            )
            return fallback_history["id"]
