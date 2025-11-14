import logging
from typing import Any, Dict, List, Optional

import httpx

from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class ENAService:
    """European Nucleotide Archive API service with Redis caching"""

    def __init__(self, cache: CacheService):
        self.cache = cache
        self.settings = get_settings()
        self.base_url = self.settings.ENA_API_BASE
        self.timeout = httpx.Timeout(30.0)  # 30 second timeout

    async def search_by_taxonomy(
        self, taxonomy_id: str, limit: int = 300, use_cache: bool = True
    ) -> Dict[str, Any]:
        """Search for sequencing data by taxonomy ID with caching"""
        cache_key = f"ena:taxonomy:{taxonomy_id}:limit:{limit}"

        # Check cache first
        if use_cache:
            cached_result = await self.cache.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for taxonomy search: {taxonomy_id}")
                return {"data": cached_result, "cached": True}

        # Make API request
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {
                    "result": "read_run",
                    "query": f"tax_tree({taxonomy_id})",
                    "format": "json",
                    "limit": limit,
                    "fields": "accession,study_accession,sample_accession,experiment_accession,run_accession,tax_id,scientific_name,library_strategy,library_source,library_selection,read_count,base_count,first_public,last_updated,collection_date,study_title,sample_title,experiment_title,instrument_model,instrument_platform,fastq_bytes,fastq_ftp,library_layout",
                }

                logger.info(f"Making ENA API request for taxonomy: {taxonomy_id}")
                response = await client.get(f"{self.base_url}/search", params=params)
                response.raise_for_status()

                data = response.json()

                # Cache the result
                if use_cache:
                    await self.cache.set(cache_key, data, ttl=CacheTTL.ONE_HOUR)
                    logger.info(f"Cached taxonomy search result: {taxonomy_id}")

                return {"data": data, "cached": False}

        except httpx.HTTPError as e:
            logger.error(f"ENA API error for taxonomy {taxonomy_id}: {e}")
            raise Exception(f"Failed to fetch data from ENA: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in taxonomy search: {e}")
            raise

    async def get_by_accession(
        self, accession: str, result_type: str = "read_run", use_cache: bool = True
    ) -> Dict[str, Any]:
        """Get sequencing data by accession number"""
        cache_key = f"ena:accession:{result_type}:{accession}"

        # Check cache first
        if use_cache:
            cached_result = await self.cache.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for accession lookup: {accession}")
                return {"data": cached_result, "cached": True}

        # Make API request
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {
                    "result": result_type,
                    "query": f"accession={accession}",
                    "format": "json",
                    "fields": "accession,study_accession,sample_accession,experiment_accession,run_accession,tax_id,scientific_name,library_strategy,library_source,library_selection,read_count,base_count,study_title,sample_title,experiment_title,first_public,last_updated,collection_date,instrument_model,instrument_platform,fastq_bytes,fastq_ftp,library_layout",
                }

                logger.info(f"Making ENA API request for accession: {accession}")
                response = await client.get(f"{self.base_url}/search", params=params)
                response.raise_for_status()

                data = response.json()

                # Cache the result
                if use_cache:
                    await self.cache.set(cache_key, data, ttl=CacheTTL.ONE_HOUR)
                    logger.info(f"Cached accession lookup result: {accession}")

                return {"data": data, "cached": False}

        except httpx.HTTPError as e:
            logger.error(f"ENA API error for accession {accession}: {e}")
            raise Exception(f"Failed to fetch data from ENA: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in accession lookup: {e}")
            raise

    async def search_by_keywords(
        self, keywords: List[str], limit: int = 300, use_cache: bool = True
    ) -> Dict[str, Any]:
        """Search for sequencing data by keywords"""
        # Create query string from keywords
        # Use proper ENA query syntax
        query_terms = []
        for keyword in keywords:
            if keyword.strip():
                # Remove quotes and special characters
                clean_keyword = keyword.replace('"', "").replace("'", "").strip()
                # For organisms, search scientific name (no quotes needed)
                if any(
                    word in clean_keyword.lower()
                    for word in [
                        "plasmodium",
                        "candida",
                        "escherichia",
                        "mycobacterium",
                        "cryptococcus",
                        "aspergillus",
                    ]
                ):
                    query_terms.append(f"scientific_name={clean_keyword}")
                # For library strategies (RNA-Seq, WGS, etc.)
                elif any(
                    word in clean_keyword.lower()
                    for word in [
                        "rna-seq",
                        "wgs",
                        "chip-seq",
                        "atac-seq",
                        "whole genome",
                        "wxs",
                        "wes",
                        "exome",
                        "amplicon",
                        "bisulfite",
                    ]
                ):
                    # Map common terms to ENA library_strategy values (with quotes)
                    if "rna" in clean_keyword.lower():
                        query_terms.append('library_strategy="RNA-Seq"')
                    elif (
                        "wgs" in clean_keyword.lower()
                        or "whole genome" in clean_keyword.lower()
                    ):
                        query_terms.append('library_strategy="WGS"')
                    elif (
                        "wxs" in clean_keyword.lower()
                        or "wes" in clean_keyword.lower()
                        or "exome" in clean_keyword.lower()
                    ):
                        query_terms.append('library_strategy="WXS"')
                    elif "chip" in clean_keyword.lower():
                        query_terms.append('library_strategy="ChIP-Seq"')
                    elif "atac" in clean_keyword.lower():
                        query_terms.append('library_strategy="ATAC-seq"')
                    elif "amplicon" in clean_keyword.lower():
                        query_terms.append('library_strategy="AMPLICON"')
                    elif "bisulfite" in clean_keyword.lower():
                        query_terms.append('library_strategy="Bisulfite-Seq"')
                # For sequencing platforms/technologies - map to ENA platform codes
                elif "illumina" in clean_keyword.lower():
                    query_terms.append("instrument_platform=ILLUMINA")
                elif "pacbio" in clean_keyword.lower():
                    query_terms.append("instrument_platform=PACBIO_SMRT")
                elif (
                    "nanopore" in clean_keyword.lower()
                    or "oxford" in clean_keyword.lower()
                ):
                    query_terms.append("instrument_platform=OXFORD_NANOPORE")
                elif "ion torrent" in clean_keyword.lower():
                    query_terms.append("instrument_platform=ION_TORRENT")
                elif any(
                    word in clean_keyword.lower()
                    for word in ["miseq", "hiseq", "novaseq", "nextseq"]
                ):
                    # These are Illumina instruments
                    query_terms.append("instrument_platform=ILLUMINA")
                # For library sources
                elif clean_keyword.upper() in [
                    "GENOMIC",
                    "TRANSCRIPTOMIC",
                    "METAGENOMIC",
                    "METATRANSCRIPTOMIC",
                    "SYNTHETIC",
                    "VIRAL RNA",
                ]:
                    query_terms.append(f"library_source={clean_keyword.upper()}")
                # For assembly levels
                elif any(
                    word in clean_keyword.lower()
                    for word in ["complete genome", "chromosome", "scaffold", "contig"]
                ):
                    # These might not be directly searchable in ENA, but include as text search
                    query_terms.append(clean_keyword)
                # Skip generic keywords that would cause issues
                elif clean_keyword.lower() in ["data", "sequencing"]:
                    continue
                # Default: text search
                else:
                    query_terms.append(clean_keyword)

        query_string = " AND ".join(query_terms) if query_terms else ""
        if not query_string:
            return {"data": [], "cached": False}

        cache_params = {"keywords": sorted(keywords), "limit": limit}
        cache_key = self.cache.make_key("ena:search", cache_params)

        # Check cache first
        if use_cache:
            cached_result = await self.cache.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for keyword search: {keywords}")
                return {"data": cached_result, "cached": True}

        # Make API request
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {
                    "result": "read_run",
                    "query": query_string,  # Remove extra parentheses
                    "format": "json",
                    "limit": limit,
                    "fields": "accession,study_accession,sample_accession,experiment_accession,run_accession,tax_id,scientific_name,library_strategy,library_source,library_selection,read_count,base_count,study_title,sample_title,experiment_title,first_public,last_updated,collection_date,instrument_model,instrument_platform,fastq_bytes,fastq_ftp,library_layout",
                }

                logger.info(f"Making ENA API request for keywords: {keywords}")
                response = await client.get(f"{self.base_url}/search", params=params)
                response.raise_for_status()

                data = response.json()

                # Cache the result
                if use_cache:
                    await self.cache.set(cache_key, data, ttl=CacheTTL.ONE_HOUR)
                    logger.info(f"Cached keyword search result: {keywords}")

                return {"data": data, "cached": False}

        except httpx.HTTPError as e:
            logger.error(f"ENA API error for keywords {keywords}: {e}")
            raise Exception(f"Failed to fetch data from ENA: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in keyword search: {e}")
            raise

    async def get_study_info(
        self, study_accession: str, use_cache: bool = True
    ) -> Dict[str, Any]:
        """Get detailed study information by study accession"""
        cache_key = f"ena:study:{study_accession}"

        # Check cache first
        if use_cache:
            cached_result = await self.cache.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for study info: {study_accession}")
                return {"data": cached_result, "cached": True}

        # Make API request
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {
                    "result": "study",
                    "query": f"study_accession={study_accession}",
                    "format": "json",
                    "fields": "study_accession,study_title,study_description,study_abstract,center_name,broker_name,submission_date,first_public,last_updated",
                }

                logger.info(f"Making ENA API request for study: {study_accession}")
                response = await client.get(f"{self.base_url}/search", params=params)
                response.raise_for_status()

                data = response.json()

                # Cache the result
                if use_cache:
                    await self.cache.set(cache_key, data, ttl=CacheTTL.ONE_HOUR)
                    logger.info(f"Cached study info result: {study_accession}")

                return {"data": data, "cached": False}

        except httpx.HTTPError as e:
            logger.error(f"ENA API error for study {study_accession}: {e}")
            raise Exception(f"Failed to fetch study data from ENA: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in study lookup: {e}")
            raise
