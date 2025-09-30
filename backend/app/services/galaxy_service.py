"""Galaxy API integration service using BioBLEND."""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from bioblend.galaxy import GalaxyInstance
from bioblend.galaxy.histories import HistoryClient
from bioblend.galaxy.tools import ToolClient
from bioblend.galaxy.jobs import JobsClient
from bioblend.galaxy.datasets import DatasetClient
from app.core.config import get_settings
from app.core.cache import CacheService, CacheTTL
from app.models.galaxy import (
    GalaxyJobSubmission,
    GalaxyJobResponse,
    GalaxyJobDetails,
    GalaxyJobStatus,
    GalaxyJobResult,
    GalaxyJobState,
    GalaxyJobOutput,
    GalaxyDataset,
    GalaxyAPIError,
    GalaxyAPIResponse
)

logger = logging.getLogger(__name__)


class GalaxyService:
    """Service for interacting with Galaxy API using BioBLEND."""
    
    def __init__(self, cache: CacheService):
        self.cache = cache
        self.settings = get_settings()
        
        # Check if Galaxy is configured
        if not self.settings.GALAXY_API_KEY:
            logger.warning("Galaxy API key not configured - Galaxy features will be disabled")
            self._galaxy_available = False
            self.gi = None
        else:
            self._galaxy_available = True
            # Initialize BioBLEND Galaxy instance
            self.gi = GalaxyInstance(
                url=self.settings.GALAXY_API_URL.replace('/api', ''),  # BioBLEND expects base URL without /api
                key=self.settings.GALAXY_API_KEY
            )
            logger.info(f"Galaxy service initialized with BioBLEND for URL: {self.settings.GALAXY_API_URL}")
        
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
            raise Exception("Galaxy service not available - check API key configuration")
        
        logger.info(f"Submitting Galaxy job with {len(submission.tabular_data)} chars of data")
        
        try:
            # Step 0: Get or create the shared BRC Analytics history
            history_id = await self._get_or_create_shared_history()
            
            # Step 1: Upload the tabular data
            upload_dataset_id = await self._upload_tabular_data(
                submission.tabular_data, 
                submission.filename,
                history_id
            )
            
            # Step 2: Run the random lines tool on the uploaded data
            job_id = await self._run_random_lines_tool(
                upload_dataset_id, 
                submission.num_random_lines,
                history_id
            )
            
            return GalaxyJobResponse(
                job_id=job_id,
                upload_dataset_id=upload_dataset_id,
                status="submitted",
                message=f"Job {job_id} submitted successfully"
            )
            
        except Exception as e:
            logger.error(f"Failed to submit Galaxy job: {str(e)}")
            raise Exception(f"Galaxy job submission failed: {str(e)}")
    
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
            # Use BioBLEND to get job details
            job_data = self.gi.jobs.show_job(job_id)
            
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
                exit_code=job_data.get("exit_code")
            )
            
            # Debug: log state changes
            logger.info(f"BioBLEND Job {job_id} current state: {job_data['state']}, complete: {status.is_complete}, successful: {status.is_successful}")
            
            # If job is complete, get outputs
            if status.is_complete:
                status.outputs = await self._get_job_outputs(job_id)
                # Cache completed job status for 1 hour
                await self.cache.set(cache_key, status.dict(), CacheTTL.ONE_HOUR)
            
            return status
                
        except Exception as e:
            logger.error(f"BioBLEND error getting job status: {e}")
            raise Exception(f"Failed to get job status using BioBLEND: {str(e)}")
    
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
                raise Exception(f"Job {job_id} is not yet complete (state: {status.state})")
            
            if not status.is_successful:
                raise Exception(f"Job {job_id} failed with state: {status.state}")
            
            # Get output contents
            results = {}
            for output in status.outputs:
                try:
                    content = await self._get_dataset_content(output.dataset.id)
                    results[output.name] = content
                except Exception as e:
                    logger.warning(f"Failed to get content for output {output.name}: {e}")
                    results[output.name] = f"Error retrieving content: {str(e)}"
            
            # Create result object
            result = GalaxyJobResult(
                job_id=job_id,
                status=status.state,
                outputs=status.outputs,
                results=results,
                created_time=status.created_time,
                completed_time=status.updated_time
            )
            
            # Cache results for 24 hours
            await self.cache.set(cache_key, result.dict(), CacheTTL.ONE_DAY)
            return result
            
        except Exception as e:
            logger.error(f"Error getting job results: {e}")
            raise Exception(f"Failed to get job results: {str(e)}")
    
    
    async def _upload_tabular_data(self, data: str, filename: str, history_id: str) -> str:
        """Upload tabular data to Galaxy using BioBLEND and return dataset ID."""
        try:
            # Use BioBLEND's paste_content method for uploading text data
            upload_result = self.gi.tools.paste_content(
                content=data,
                history_id=history_id,
                file_name=filename,
                file_type='tabular'
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
            raise Exception(f"Failed to upload data using BioBLEND: {str(e)}")
    
    async def _run_random_lines_tool(self, input_dataset_id: str, num_lines: int, history_id: str) -> str:
        """Run the random lines tool using BioBLEND and return job ID."""
        try:
            tool_inputs = {
                "input": {
                    "src": "hda",
                    "id": input_dataset_id
                },
                "num_lines": str(num_lines),
                "seed_source|seed_source_selector": "no_seed"
            }
            
            # Use BioBLEND to run the tool
            tool_response = self.gi.tools.run_tool(
                history_id=history_id,
                tool_id=self.settings.GALAXY_RANDOM_LINES_TOOL_ID,
                tool_inputs=tool_inputs
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
            raise Exception(f"Failed to run random lines tool using BioBLEND: {str(e)}")
    
    async def _get_job_outputs(self, job_id: str) -> List[GalaxyJobOutput]:
        """Get output information for a job using BioBLEND."""
        try:
            # Get job outputs using BioBLEND
            job_details = self.gi.jobs.show_job(job_id)
            outputs = []
            
            # Get outputs from job details
            job_outputs = job_details.get("outputs", {})
            
            for output_name, output_data in job_outputs.items():
                # Get dataset details using BioBLEND
                dataset_details = self.gi.datasets.show_dataset(output_data["id"])
                
                dataset_info = GalaxyDataset(
                    id=dataset_details["id"],
                    name=dataset_details["name"],
                    state=dataset_details["state"],
                    file_ext=dataset_details.get("file_ext", "txt"),
                    file_size=dataset_details.get("file_size"),
                    created_time=dataset_details.get("created_time"),
                    updated_time=dataset_details.get("updated_time")
                )
                
                output = GalaxyJobOutput(
                    id=dataset_details["id"],
                    name=output_name,
                    dataset=dataset_info
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
            content = self.gi.datasets.download_dataset(dataset_id)
            if isinstance(content, bytes):
                return content.decode('utf-8')
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
            histories = self.gi.histories.get_histories()
            
            # Look for existing shared history
            for history in histories:
                if history.get("name") == shared_history_name:
                    history_id = history["id"]
                    logger.info(f"Using existing shared history: {history_id} ({shared_history_name})")
                    self._shared_history_id = history_id
                    return history_id
            
            # If we get here, the shared history doesn't exist, so create it
            logger.info(f"Creating new shared history: {shared_history_name}")
            new_history = self.gi.histories.create_history(name=shared_history_name)
            history_id = new_history["id"]
            logger.info(f"Created shared history: {history_id} ({shared_history_name})")
            self._shared_history_id = history_id
            return history_id
                
        except Exception as e:
            logger.error(f"Error getting or creating shared history: {e}")
            # Fallback to creating a new history with timestamp
            import time
            fallback_name = f"{shared_history_name} - {int(time.time())}"
            logger.warning(f"Falling back to creating history: {fallback_name}")
            fallback_history = self.gi.histories.create_history(name=fallback_name)
            return fallback_history["id"]