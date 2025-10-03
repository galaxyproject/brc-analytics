"""Service for generating NCBI link data from BRC Analytics catalog."""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class NCBILinksService:
    """Service to generate link files for NCBI cross-referencing."""

    def __init__(self, catalog_path: str = "/catalog/output"):
        self.catalog_path = Path(catalog_path)
        self.base_url = "https://brc-analytics.org"

    def _load_json_file(self, filename: str) -> List[Dict[str, Any]]:
        file_path = self.catalog_path / filename
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"Catalog file not found: {file_path}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON from {file_path}: {e}")
            return []

    def get_organism_links(self) -> List[Dict[str, str]]:
        organisms = self._load_json_file("organisms.json")
        links = []

        for org in organisms:
            taxonomy_id = org.get("ncbiTaxonomyId")
            if not taxonomy_id:
                continue

            links.append(
                {
                    "ncbiTaxonomyId": taxonomy_id,
                    "url": f"{self.base_url}/data/organisms/{taxonomy_id}",
                    "scientificName": org.get("taxonomicLevelSpecies"),
                    "commonName": org.get("commonName"),
                }
            )

        logger.info(f"Generated {len(links)} organism links")
        return links

    def get_assembly_links(self) -> List[Dict[str, str]]:
        assemblies = self._load_json_file("assemblies.json")
        links = []

        for assembly in assemblies:
            accession = assembly.get("accession")
            if not accession:
                continue

            url_accession = accession.replace(".", "_")
            links.append(
                {
                    "accession": accession,
                    "url": f"{self.base_url}/data/assemblies/{url_accession}",
                    "ncbiTaxonomyId": assembly.get("ncbiTaxonomyId"),
                    "scientificName": assembly.get("taxonomicLevelSpecies"),
                }
            )

        logger.info(f"Generated {len(links)} assembly links")
        return links
