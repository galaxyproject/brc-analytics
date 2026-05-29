"""SRA-DuckDB mirror service.

Wraps a read-only DuckDB connection to a local mirror of SRA run metadata
filtered to BRC-relevant organisms. The mirror is built externally (see
the sra-poc plan in ~/work/brain/plans/brc-analytics-sra-duckdb-metadata)
and includes a `taxid_names` table for taxid-anchored name resolution
plus a `mirror_meta` table for provenance metadata.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import duckdb

logger = logging.getLogger(__name__)

# In-process per-call TTL for repeated reads (e.g. the assistant chatting
# about the same organism across turns). DuckDB queries are already fast
# but `summary_for_organism` runs ~6 aggregates -- caching collapses that
# to a hashmap hit for the second-and-later asks in a session. Tool calls
# are sync and run in the asyncio event loop's thread, so a plain dict is
# safe without locks.
_CACHE_TTL_SECONDS = 300


# Curated abbreviations and colloquial names. NCBI's taxonomy `names.dmp`
# has scientific names and a thicket of historical synonyms, but it
# generally does not list lay abbreviations like "SARS-CoV-2" or "TB" --
# so the model passes those through unchanged and our taxid_names lookup
# misses. Each alias here maps to the BRC catalog organism taxid; the
# full SRA name union is expanded from taxid_names as usual at resolve
# time, so a single alias entry transparently covers every SRA name
# variant attached to that taxid. Keys are stored lowercase; the lookup
# lower-cases the user term.
#
# Verified 2026-05-24: every taxid here resolves to a catalog organism
# with non-zero runs in the mirror. NCBI's 2024 ICTV-aligned virus
# renames produced new species-level taxids (HIV-1 = 3418650, not the
# old 11676, etc.) -- using the new ones.
_ORGANISM_ALIASES: Dict[str, int] = {
    # Viruses
    "sars-cov-2": 3418604,
    "sars cov 2": 3418604,
    "sarscov2": 3418604,
    "covid": 3418604,
    "covid-19": 3418604,
    "hiv": 3418650,  # default to HIV-1, the dominant case in SRA
    "hiv-1": 3418650,
    "hiv1": 3418650,
    "hiv-2": 3418651,
    "hbv": 3431302,
    "hcv": 3052230,
    "ebv": 3050299,
    "wnv": 3048448,
    "zikv": 3048459,
    "mpxv": 3431483,
    "mpox": 3431483,
    "ebola": 3052462,
    "ebov": 3052462,
    # Bacteria
    "tb": 1773,
    "mtb": 1773,
    "m. tuberculosis": 1773,
    "m.tuberculosis": 1773,
    "k. pneumoniae": 573,
    "k.pneumoniae": 573,
    "s. aureus": 1280,
    "s.aureus": 1280,
    "e. coli": 562,
    "e.coli": 562,
    # Apicomplexa
    "p. falciparum": 5833,
    "p.falciparum": 5833,
    "p. vivax": 5855,
    "p.vivax": 5855,
    # Fungi
    "c. auris": 498019,
    "c.auris": 498019,
    "c. albicans": 5476,
    "c.albicans": 5476,
    "a. fumigatus": 746128,
    "a.fumigatus": 746128,
    # Model organisms also present as BRC catalog entries
    "s. cerevisiae": 4932,
    "s.cerevisiae": 4932,
    "d. melanogaster": 7227,
    "d.melanogaster": 7227,
}


class SRAMirrorService:
    """Read-only access to the local SRA-DuckDB mirror."""

    def __init__(self, mirror_path: str):
        self.mirror_path = mirror_path
        self._con: Optional[duckdb.DuckDBPyConnection] = None
        self._meta: Dict[str, str] = {}
        self._total_runs: Optional[int] = None
        self._cache: Dict[Tuple, Tuple[float, Any]] = {}
        self._initialize()

    def _cache_get(self, key: Tuple) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry is None:
            return None
        ts, value = entry
        if time.monotonic() - ts >= _CACHE_TTL_SECONDS:
            return None
        return value

    def _cache_put(self, key: Tuple, value: Any) -> None:
        self._cache[key] = (time.monotonic(), value)

    def _initialize(self) -> None:
        # Path('').exists() is True (it resolves to '.'), so guard the empty
        # case explicitly and require an actual file -- otherwise an unset
        # SRA_MIRROR_PATH falls through to duckdb.connect('', read_only=True),
        # which raises and logs a scary traceback on every default-deploy boot.
        if not self.mirror_path:
            logger.info("SRA_MIRROR_PATH not set -- SRA mirror service disabled")
            return
        if not Path(self.mirror_path).is_file():
            logger.warning(
                "SRA mirror not found at %s -- service will report unavailable",
                self.mirror_path,
            )
            return
        try:
            self._con = duckdb.connect(self.mirror_path, read_only=True)
            self._meta = dict(
                self._con.execute("SELECT key, value FROM mirror_meta").fetchall()
            )
            self._total_runs = self._con.execute(
                "SELECT COUNT(*) FROM runs"
            ).fetchone()[0]
            logger.info(
                "SRA mirror loaded: %s rows, built %s",
                f"{self._total_runs:,}",
                self._meta.get("mirror_built_at", "unknown"),
            )
        except Exception:
            logger.exception("Failed to open SRA mirror at %s", self.mirror_path)
            self._con = None

    def is_available(self) -> bool:
        return self._con is not None

    def _provenance(self, resolved_names: List[str]) -> Dict[str, Any]:
        return {
            "mirror_built_at": self._meta.get("mirror_built_at"),
            "taxdump_version": self._meta.get("taxdump_version"),
            "total_runs_in_mirror": self._total_runs,
            "resolved_names_for_query": resolved_names,
        }

    def _resolve_organism(self, organism: str) -> tuple[Optional[int], List[str]]:
        """Resolve a user-supplied organism term to (taxid, names_in_mirror).

        Accepts either an NCBI taxonomy id ("5833") or a scientific name
        ("Plasmodium falciparum", or any known synonym such as "Candida
        auris"). Returns (taxid, list_of_names) -- the list is what to
        match against the `runs.organism` column.

        If the term doesn't match any known taxid or name, falls back to
        a single-element list with the literal input so the caller still
        gets a chance to find something via exact match.
        """
        if not self._con:
            return None, [organism]

        term = organism.strip()

        if term.isdigit():
            taxid = int(term)
            rows = self._con.execute(
                "SELECT name FROM taxid_names WHERE taxid = ?", [taxid]
            ).fetchall()
            if rows:
                return taxid, [r[0] for r in rows]
            return taxid, [term]

        # Curated abbreviation alias check (case-insensitive, whitespace-
        # tolerant). NCBI's name table doesn't list lay abbreviations like
        # "SARS-CoV-2" or "TB", so these would otherwise miss.
        alias_taxid = _ORGANISM_ALIASES.get(" ".join(term.lower().split()))
        if alias_taxid is not None:
            rows = self._con.execute(
                "SELECT name FROM taxid_names WHERE taxid = ?", [alias_taxid]
            ).fetchall()
            if rows:
                return alias_taxid, [r[0] for r in rows]
            return alias_taxid, [term]

        rows = self._con.execute(
            """
            SELECT DISTINCT taxid FROM taxid_names
            WHERE LOWER(name) = LOWER(?)
            """,
            [term],
        ).fetchall()
        if rows:
            taxid = rows[0][0]
            names = self._con.execute(
                "SELECT name FROM taxid_names WHERE taxid = ?", [taxid]
            ).fetchall()
            return taxid, [r[0] for r in names]

        return None, [term]

    def summary_for_organism(self, organism: str) -> Dict[str, Any]:
        """High-leverage one-call snapshot for an organism.

        Returns total run count, top platforms/assays/countries, recent
        activity, top BioProjects, plus provenance metadata.
        """
        if not self._con:
            return {"error": "SRA mirror not available"}

        cache_key = ("summary", organism)
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        taxid, names = self._resolve_organism(organism)
        con = self._con

        n_runs, n_projects, n_studies, earliest, latest = con.execute(
            """
            SELECT
                COUNT(*),
                COUNT(DISTINCT bioproject),
                COUNT(DISTINCT sra_study),
                MIN(releasedate),
                MAX(releasedate)
            FROM runs WHERE organism IN (SELECT UNNEST(?))
            """,
            [names],
        ).fetchone()

        if not n_runs:
            empty = {
                "input": organism,
                "resolved_taxid": taxid,
                "n_runs": 0,
                "message": (
                    f"No runs found in the SRA mirror for '{organism}'. "
                    "The organism may not be in the BRC catalog or there is "
                    "no public SRA data."
                ),
                "_meta": self._provenance(names),
            }
            self._cache_put(cache_key, empty)
            return empty

        platforms = con.execute(
            """
            SELECT platform, COUNT(*) AS n FROM runs
            WHERE organism IN (SELECT UNNEST(?)) AND platform IS NOT NULL
            GROUP BY platform ORDER BY n DESC LIMIT 5
            """,
            [names],
        ).fetchall()

        assays = con.execute(
            """
            SELECT assay_type, COUNT(*) AS n FROM runs
            WHERE organism IN (SELECT UNNEST(?)) AND assay_type IS NOT NULL
            GROUP BY assay_type ORDER BY n DESC LIMIT 10
            """,
            [names],
        ).fetchall()

        countries = con.execute(
            """
            SELECT geo_loc_name_country_calc AS country, COUNT(*) AS n FROM runs
            WHERE organism IN (SELECT UNNEST(?))
              AND geo_loc_name_country_calc IS NOT NULL
              AND geo_loc_name_country_calc != 'uncalculated'
            GROUP BY country ORDER BY n DESC LIMIT 10
            """,
            [names],
        ).fetchall()

        top_projects = con.execute(
            """
            SELECT bioproject, COUNT(*) AS n_runs, MIN(releasedate) AS earliest, MAX(releasedate) AS latest
            FROM runs
            WHERE organism IN (SELECT UNNEST(?)) AND bioproject IS NOT NULL
            GROUP BY bioproject ORDER BY n_runs DESC LIMIT 10
            """,
            [names],
        ).fetchall()

        recent_count = con.execute(
            """
            SELECT COUNT(*) FROM runs
            WHERE organism IN (SELECT UNNEST(?))
              AND releasedate >= CURRENT_DATE - INTERVAL 90 DAY
            """,
            [names],
        ).fetchone()[0]

        result = {
            "input": organism,
            "resolved_taxid": taxid,
            "n_runs": n_runs,
            "n_bioprojects": n_projects,
            "n_studies": n_studies,
            "earliest_release": str(earliest) if earliest else None,
            "latest_release": str(latest) if latest else None,
            "runs_last_90_days": recent_count,
            "top_platforms": [{"platform": p, "n_runs": n} for p, n in platforms],
            "top_assay_types": [{"assay_type": a, "n_runs": n} for a, n in assays],
            "top_countries": [{"country": c, "n_runs": n} for c, n in countries],
            "top_bioprojects": [
                {
                    "bioproject": bp,
                    "n_runs": n,
                    "earliest_release": str(e) if e else None,
                    "latest_release": str(la) if la else None,
                }
                for bp, n, e, la in top_projects
            ],
            "_meta": self._provenance(names),
        }
        self._cache_put(cache_key, result)
        return result

    def search_runs(
        self,
        organism: str,
        assay_type: Optional[str] = None,
        platform: Optional[str] = None,
        country: Optional[str] = None,
        since: Optional[str] = None,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """Search for runs by organism + filters."""
        if not self._con:
            return {"error": "SRA mirror not available"}

        cache_key = ("search", organism, assay_type, platform, country, since, limit)
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        taxid, names = self._resolve_organism(organism)
        clauses = ["organism IN (SELECT UNNEST(?))"]
        params: List[Any] = [names]

        if assay_type:
            clauses.append("assay_type = ?")
            params.append(assay_type)
        if platform:
            clauses.append("platform = ?")
            params.append(platform)
        if country:
            clauses.append("geo_loc_name_country_calc = ?")
            params.append(country)
        if since:
            clauses.append("releasedate >= ?")
            params.append(since)

        where = " AND ".join(clauses)
        rows = self._con.execute(
            f"""
            SELECT acc, sra_study, bioproject, organism, assay_type, platform,
                   instrument, librarylayout, releasedate,
                   geo_loc_name_country_calc, mbases
            FROM runs WHERE {where}
            ORDER BY releasedate DESC
            LIMIT ?
            """,
            params + [limit],
        ).fetchall()

        results = [
            {
                "accession": r[0],
                "study": r[1],
                "bioproject": r[2],
                "organism": r[3],
                "assay_type": r[4],
                "platform": r[5],
                "instrument": r[6],
                "library_layout": r[7],
                "release_date": str(r[8]) if r[8] else None,
                "country": r[9],
                "mbases": r[10],
            }
            for r in rows
        ]

        result = {
            "input": organism,
            "resolved_taxid": taxid,
            "filters_applied": {
                k: v
                for k, v in {
                    "assay_type": assay_type,
                    "platform": platform,
                    "country": country,
                    "since": since,
                }.items()
                if v
            },
            "n_returned": len(results),
            "limit": limit,
            "runs": results,
            "_meta": self._provenance(names),
        }
        self._cache_put(cache_key, result)
        return result

    def top_bioprojects_for_organism(
        self, organism: str, limit: int = 20
    ) -> Dict[str, Any]:
        """Per Anton #723: rank BioProjects by run count, include study count
        and earliest/latest release dates."""
        if not self._con:
            return {"error": "SRA mirror not available"}

        cache_key = ("top_bioprojects", organism, limit)
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        taxid, names = self._resolve_organism(organism)
        rows = self._con.execute(
            """
            SELECT bioproject,
                   COUNT(*) AS n_runs,
                   COUNT(DISTINCT sra_study) AS n_studies,
                   MIN(releasedate) AS earliest,
                   MAX(releasedate) AS latest
            FROM runs
            WHERE organism IN (SELECT UNNEST(?)) AND bioproject IS NOT NULL
            GROUP BY bioproject
            ORDER BY n_runs DESC
            LIMIT ?
            """,
            [names, limit],
        ).fetchall()

        result = {
            "input": organism,
            "resolved_taxid": taxid,
            "n_returned": len(rows),
            "bioprojects": [
                {
                    "bioproject": bp,
                    "n_runs": n_runs,
                    "n_studies": n_studies,
                    "earliest_release": str(e) if e else None,
                    "latest_release": str(la) if la else None,
                }
                for bp, n_runs, n_studies, e, la in rows
            ],
            "_meta": self._provenance(names),
        }
        self._cache_put(cache_key, result)
        return result

    def get_study_runs(self, accession: str, limit: int = 200) -> Dict[str, Any]:
        """Get runs by SRA study (SRP*/ERP*/DRP*) or BioProject (PRJ*) accession."""
        if not self._con:
            return {"error": "SRA mirror not available"}

        cache_key = ("study_runs", accession, limit)
        if (cached := self._cache_get(cache_key)) is not None:
            return cached

        column = "bioproject" if accession.startswith("PRJ") else "sra_study"
        rows = self._con.execute(
            f"""
            SELECT acc, sra_study, bioproject, organism, assay_type, platform,
                   instrument, librarylayout, releasedate,
                   geo_loc_name_country_calc, mbases
            FROM runs
            WHERE {column} = ?
            ORDER BY releasedate DESC
            LIMIT ?
            """,
            [accession, limit],
        ).fetchall()

        result = {
            "accession": accession,
            "matched_column": column,
            "n_returned": len(rows),
            "limit": limit,
            "runs": [
                {
                    "accession": r[0],
                    "study": r[1],
                    "bioproject": r[2],
                    "organism": r[3],
                    "assay_type": r[4],
                    "platform": r[5],
                    "instrument": r[6],
                    "library_layout": r[7],
                    "release_date": str(r[8]) if r[8] else None,
                    "country": r[9],
                    "mbases": r[10],
                }
                for r in rows
            ],
            "_meta": self._provenance([]),
        }
        self._cache_put(cache_key, result)
        return result
