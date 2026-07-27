"""Galaxy API integration service using BioBLEND."""

import asyncio
import json
import logging
import time
from typing import List, Optional

from bioblend.galaxy import GalaxyInstance

from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings
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
)

logger = logging.getLogger(__name__)

# kmindex splits an index into shards and emits one JSON dataset per shard, so a
# single query fans out into dozens of dataset downloads. Galaxy answers 429 if
# those go out unthrottled.
KMINDEX_MAX_CONCURRENT_DOWNLOADS = 4
KMINDEX_DOWNLOAD_ATTEMPTS = 5
KMINDEX_BACKOFF_SECONDS = 2.0

# Ceiling on the merged hit list. A permissive threshold against a large index
# can return far more than anyone will page through, and the whole list is
# cached as one Redis value.
KMINDEX_MAX_HITS = 50000


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


class GalaxyService:
    """Service for interacting with Galaxy API using BioBLEND."""

    def __init__(self, cache: CacheService):
        self.cache = cache
        self.settings = get_settings()

        # Check if Galaxy is configured
        if not self.settings.GALAXY_API_KEY:
            logger.warning(
                "Galaxy API key not configured - Galaxy features will be disabled"
            )
            self._galaxy_available = False
            self.gi = None
        else:
            self._galaxy_available = True
            # Initialize BioBLEND Galaxy instance
            self.gi = GalaxyInstance(
                url=self.settings.GALAXY_API_URL.replace(
                    "/api", ""
                ),  # BioBLEND expects base URL without /api
                key=self.settings.GALAXY_API_KEY,
            )
            logger.info(
                "Galaxy service initialized with BioBLEND for URL: "
                f"{self.settings.GALAXY_API_URL}"
            )

        # Shared BRC Analytics history
        self._shared_history_id = None

    def is_available(self) -> bool:
        """Check if Galaxy service is available."""
        return self._galaxy_available and bool(self.settings.GALAXY_API_KEY)

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
            f"Submitting kmindex query against {submission.index} "
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
                message=f"kmindex job {job_id} submitted against {submission.index}",
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
                await asyncio.sleep(delay)
                delay *= 2
        return None

    async def get_kmindex_results(
        self, job_id: str, limit: int = 100, offset: int = 0
    ) -> KmindexResults:
        """Merge a kmindex job's per-shard outputs into one ranked hit list."""
        if not self.is_available():
            raise Exception("Galaxy service not available")

        cache_key = self.cache.make_key("galaxy:kmindex_agg", {"job_id": job_id})
        cached = await self.cache.get(cache_key)
        if cached:
            return self._page_kmindex(cached, job_id, limit, offset)

        status = await self.get_job_status(job_id)
        if not status.is_complete:
            raise Exception(f"Job {job_id} is not yet complete (state: {status.state})")
        if not status.is_successful:
            raise Exception(f"Job {job_id} failed with state: {status.state}")

        semaphore = asyncio.Semaphore(KMINDEX_MAX_CONCURRENT_DOWNLOADS)
        shards = await asyncio.gather(
            *(self._download_shard(o.dataset.id, semaphore) for o in status.outputs)
        )

        hits: List[dict] = []
        query_name = None
        shards_with_hits = 0
        for shard in shards:
            if not shard:
                continue
            # Shape is {shard_name: {query_name: {accession: score}}}.
            for shard_name, queries in shard.items():
                for name, accessions in (queries or {}).items():
                    query_name = query_name or name
                    if accessions:
                        shards_with_hits += 1
                    for accession, score in accessions.items():
                        hits.append(
                            {
                                "accession": accession,
                                "score": score,
                                "shard": shard_name,
                            }
                        )

        hits.sort(key=lambda h: h["score"], reverse=True)
        truncated = len(hits) > KMINDEX_MAX_HITS
        if truncated:
            logger.warning(
                f"kmindex job {job_id} returned {len(hits)} hits; "
                f"capping at {KMINDEX_MAX_HITS}"
            )
            hits = hits[:KMINDEX_MAX_HITS]

        aggregate = {
            "hits": hits,
            "query_name": query_name,
            "shards_searched": len(shards),
            "shards_with_hits": shards_with_hits,
            "truncated": truncated,
        }
        await self.cache.set(cache_key, aggregate, CacheTTL.ONE_DAY)
        return self._page_kmindex(aggregate, job_id, limit, offset)

    @staticmethod
    def _page_kmindex(
        aggregate: dict, job_id: str, limit: int, offset: int
    ) -> KmindexResults:
        """Slice a cached aggregate into a page of results."""
        hits = aggregate["hits"]
        return KmindexResults(
            job_id=job_id,
            query_name=aggregate.get("query_name"),
            total_hits=len(hits),
            shards_searched=aggregate.get("shards_searched", 0),
            shards_with_hits=aggregate.get("shards_with_hits", 0),
            truncated=aggregate.get("truncated", False),
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
            )

            # Debug: log state changes
            logger.info(
                f"BioBLEND Job {job_id} current state: {job_data['state']}, "
                f"complete: {status.is_complete}, successful: {status.is_successful}"
            )

            # If job is complete, get outputs
            if status.is_complete:
                status.outputs = await self._get_job_outputs(job_id)
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
        """Run kmindex_query against a Logan index and return the job ID."""
        try:
            # Conditional params must use flattened "cond|param" keys. The nested
            # dict form is accepted but silently drops the inner select, which
            # runs kmindex with --index '' and fails on the node.
            tool_inputs = {
                "db_opts|db_opts_selector": "db",
                "db_opts|kmindex": submission.index,
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
                f"Started kmindex query job {job_id} against {submission.index}"
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

    async def _get_job_outputs(self, job_id: str) -> List[GalaxyJobOutput]:
        """Get output information for a job using BioBLEND."""
        try:
            # Get job outputs using BioBLEND
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
            logger.error(f"BioBLEND error getting job outputs: {e}")
            # Fallback to empty outputs list
            return []

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
        """Get or create the shared 'BRC ANALYTICS JOBS' history using BioBLEND."""
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
