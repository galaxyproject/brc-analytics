import logging
import re
from typing import Any, Dict, List

import httpx

from app.core.cache import CacheService, CacheTTL
from app.core.config import get_settings

logger = logging.getLogger(__name__)

ORGANISM_GENERA = [
    "plasmodium",
    "candida",
    "escherichia",
    "mycobacterium",
    "cryptococcus",
    "aspergillus",
]

# Ordered (pattern, ENA term) pairs. Word boundaries keep short tokens like
# "wes" from matching inside unrelated words ("West Nile virus").
FACET_PATTERNS = [
    (r"rna-seq", 'library_strategy="RNA-Seq"'),
    (r"wgs|whole genome", 'library_strategy="WGS"'),
    (r"wxs|wes|exome", 'library_strategy="WXS"'),
    (r"chip-seq", 'library_strategy="ChIP-Seq"'),
    (r"atac-seq", 'library_strategy="ATAC-seq"'),
    (r"amplicon", 'library_strategy="AMPLICON"'),
    (r"bisulfite", 'library_strategy="Bisulfite-Seq"'),
    (r"illumina|miseq|hiseq|novaseq|nextseq", "instrument_platform=ILLUMINA"),
    (r"pacbio", "instrument_platform=PACBIO_SMRT"),
    (r"nanopore|oxford", "instrument_platform=OXFORD_NANOPORE"),
    (r"ion torrent", "instrument_platform=ION_TORRENT"),
]
_FACET_REGEXES = [
    (re.compile(rf"\b(?:{pattern})\b", re.IGNORECASE), term)
    for pattern, term in FACET_PATTERNS
]

LIBRARY_SOURCES = [
    "GENOMIC",
    "TRANSCRIPTOMIC",
    "METAGENOMIC",
    "METATRANSCRIPTOMIC",
    "SYNTHETIC",
    "VIRAL RNA",
]

GENERIC_KEYWORDS = ["data", "sequencing"]

SUPPORTED_KEYWORDS_HINT = (
    "one facet per keyword -- full organism names (e.g. 'Plasmodium "
    "falciparum') from the genera "
    + ", ".join(g.capitalize() for g in ORGANISM_GENERA)
    + "; library strategies (RNA-Seq, WGS, WXS/exome, ChIP-Seq, ATAC-seq, "
    "amplicon, bisulfite); platforms (Illumina, MiSeq/HiSeq/NovaSeq/NextSeq, "
    "PacBio, Nanopore, Ion Torrent); library sources ("
    + ", ".join(LIBRARY_SOURCES)
    + ")"
)

# Caps how much caller input gets echoed back in the error message.
MAX_ECHOED_KEYWORDS = 10
MAX_ECHOED_KEYWORD_LENGTH = 64


class UnsupportedKeywordsError(ValueError):
    """Keywords that can't be expressed as an ENA portal query."""

    def __init__(self, keywords: List[str]):
        self.keywords = keywords
        if keywords:
            shown = [
                repr(k[:MAX_ECHOED_KEYWORD_LENGTH])
                for k in keywords[:MAX_ECHOED_KEYWORDS]
            ]
            if len(keywords) > MAX_ECHOED_KEYWORDS:
                shown.append(f"and {len(keywords) - MAX_ECHOED_KEYWORDS} more")
            problem = "Unsupported ENA search keywords: " + ", ".join(shown)
        else:
            problem = "No searchable ENA keywords given"
        super().__init__(f"{problem}. Supported: {SUPPORTED_KEYWORDS_HINT}.")


def _keyword_term(keyword: str) -> str | None:
    """Map one cleaned keyword to an ENA query term, or None if unsupported."""
    facet_term = next(
        (term for regex, term in _FACET_REGEXES if regex.search(keyword)), None
    )
    if any(genus in keyword.lower() for genus in ORGANISM_GENERA):
        # "Candida auris RNA-Seq" would become an exact scientific_name match
        # on the whole string and silently return nothing.
        if facet_term is not None:
            return None
        return f'scientific_name="{keyword}"'
    if facet_term is not None:
        return facet_term
    if keyword.upper() in LIBRARY_SOURCES:
        return f'library_source="{keyword.upper()}"'
    return None


def build_keyword_query(keywords: List[str]) -> str:
    """Build an ENA portal query from free-form keywords.

    ENA rejects bare free text (and unquoted values with spaces) with a 400,
    so anything that doesn't map to a known field raises instead of being
    sent. Dropping it silently would broaden the search without telling the
    caller, and an all-dropped input would match every run in ENA.
    """
    terms: List[str] = []
    unsupported = []
    for keyword in keywords:
        # Backslashes too, so a value can't escape its closing quote.
        clean_keyword = re.sub(r"[\"'\\]", "", keyword).strip()
        if not clean_keyword or clean_keyword.lower() in GENERIC_KEYWORDS:
            continue
        term = _keyword_term(clean_keyword)
        if term is None:
            unsupported.append(clean_keyword)
        elif term not in terms:
            terms.append(term)
    if unsupported or not terms:
        raise UnsupportedKeywordsError(unsupported)
    return " AND ".join(terms)


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
            raise Exception(f"Failed to fetch data from ENA: {str(e)}") from e
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
            raise Exception(f"Failed to fetch data from ENA: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error in accession lookup: {e}")
            raise

    async def search_by_keywords(
        self, keywords: List[str], limit: int = 300, use_cache: bool = True
    ) -> Dict[str, Any]:
        """Search for sequencing data by keywords"""
        query_string = build_keyword_query(keywords)

        cache_params = {"query": query_string, "limit": limit}
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
            raise Exception(f"Failed to fetch data from ENA: {str(e)}") from e
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
            raise Exception(f"Failed to fetch study data from ENA: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error in study lookup: {e}")
            raise
