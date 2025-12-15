"""Service for generating link data from BRC Analytics catalog."""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class LinksService:
    """Service to generate link files for cross-referencing."""

    def __init__(self, catalog_path: str | None = None):
        settings = get_settings()
        self.catalog_path = Path(catalog_path or settings.CATALOG_PATH)

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

    def _build_assembly_link(self, accession: str) -> Dict[str, str]:
        """Build a single assembly link dict."""
        url_accession = accession.replace(".", "_")
        return {
            "assemblyAccession": accession,
            "relativePath": f"/data/assemblies/{url_accession}",
        }

    def _build_organism_link(self, taxonomy_id: int) -> Dict[str, Any]:
        """Build a single organism link dict."""
        return {
            "ncbiTaxonomyId": taxonomy_id,
            "relativePath": f"/data/organisms/{taxonomy_id}",
        }

    def get_assemblies_links(self) -> Dict[str, Any]:
        """Get all assembly links in v1 format."""
        assemblies = self._load_json_file("assemblies.json")
        links = []

        for assembly in assemblies:
            accession = assembly.get("accession")
            if not accession:
                continue
            links.append(self._build_assembly_link(accession))

        logger.info(f"Generated {len(links)} assembly links")
        return {
            "assemblies": links,
        }

    def get_assembly_link(self, accession: str) -> Optional[Dict[str, str]]:
        """Get a single assembly link by accession."""
        assemblies = self._load_json_file("assemblies.json")

        for assembly in assemblies:
            if assembly.get("accession") == accession:
                return self._build_assembly_link(accession)

        return None

    def get_organisms_links(self) -> Dict[str, Any]:
        """Get all organism links in v1 format."""
        organisms = self._load_json_file("organisms.json")
        links = []

        for org in organisms:
            taxonomy_id = org.get("ncbiTaxonomyId")
            if not taxonomy_id:
                continue
            links.append(self._build_organism_link(int(taxonomy_id)))

        logger.info(f"Generated {len(links)} organism links")
        return {
            "organisms": links,
        }

    def get_organism_link(self, taxon_id: int) -> Optional[Dict[str, Any]]:
        """Get a single organism link by NCBI taxonomy ID."""
        organisms = self._load_json_file("organisms.json")

        for org in organisms:
            taxonomy_id = org.get("ncbiTaxonomyId")
            if taxonomy_id is not None and int(taxonomy_id) == taxon_id:
                return self._build_organism_link(taxon_id)

        return None
