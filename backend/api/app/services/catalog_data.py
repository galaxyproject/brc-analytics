import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class CatalogData:
    """
    Loads the full BRC catalog (organisms, assemblies, workflows) into memory
    and exposes search/lookup methods used by the MCP server and assistant agent.
    """

    def __init__(self, catalog_path: str):
        self.catalog_path = Path(catalog_path)
        self.organisms: List[Dict[str, Any]] = []
        self.assemblies: List[Dict[str, Any]] = []
        self.workflow_categories: List[Dict[str, Any]] = []

        # Lookup indexes built after loading
        self._organisms_by_tax_id: Dict[str, Dict[str, Any]] = {}
        self._assemblies_by_accession: Dict[str, Dict[str, Any]] = {}
        self._assemblies_by_tax_id: Dict[str, List[Dict[str, Any]]] = {}
        self._workflows_by_iwc_id: Dict[str, Dict[str, Any]] = {}

        self._load()

    def _load(self) -> None:
        for name in ("organisms", "assemblies", "workflows"):
            path = self.catalog_path / f"{name}.json"
            if not path.exists():
                logger.warning(f"Catalog file not found: {path}")
                continue
            with open(path) as f:
                data = json.load(f)
            if name == "organisms":
                self.organisms = data
            elif name == "assemblies":
                self.assemblies = data
            elif name == "workflows":
                self.workflow_categories = data
        self._build_indexes()
        wf_count = sum(len(c.get("workflows", [])) for c in self.workflow_categories)
        logger.info(
            f"CatalogData loaded: {len(self.organisms)} organisms, "
            f"{len(self.assemblies)} assemblies, {wf_count} workflows"
        )

    def _build_indexes(self) -> None:
        for org in self.organisms:
            tax_id = str(org.get("ncbiTaxonomyId", ""))
            if tax_id:
                self._organisms_by_tax_id[tax_id] = org

        for asm in self.assemblies:
            accession = asm.get("accession", "")
            if accession:
                self._assemblies_by_accession[accession] = asm
            tax_id = str(asm.get("ncbiTaxonomyId", ""))
            if tax_id:
                self._assemblies_by_tax_id.setdefault(tax_id, []).append(asm)
            # Also index by speciesTaxonomyId so species-level lookups work
            species_tax_id = str(asm.get("speciesTaxonomyId", ""))
            if species_tax_id and species_tax_id != tax_id:
                self._assemblies_by_tax_id.setdefault(species_tax_id, []).append(asm)

        for cat in self.workflow_categories:
            for wf in cat.get("workflows", []):
                iwc_id = wf.get("iwcId", "")
                if iwc_id:
                    self._workflows_by_iwc_id[iwc_id] = {**wf, "_category": cat["name"]}

    # -- Organism methods --

    def search_organisms(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search organisms by name, taxonomy ID, or taxonomic group.
        Returns condensed records suitable for MCP responses.
        """
        q = query.lower()
        results = []
        for org in self.organisms:
            if any(
                q in str(org.get(field, "")).lower()
                for field in (
                    "taxonomicLevelSpecies",
                    "taxonomicLevelGenus",
                    "commonName",
                    "ncbiTaxonomyId",
                    "taxonomicGroup",
                    "taxonomicLevelStrain",
                    "taxonomicLevelIsolate",
                )
            ):
                results.append(self._condense_organism(org))
                if len(results) >= limit:
                    break
        return results

    def get_organism_by_taxonomy_id(self, taxonomy_id: str) -> Optional[Dict[str, Any]]:
        org = self._organisms_by_tax_id.get(str(taxonomy_id))
        if org:
            return self._condense_organism(org)
        return None

    def _condense_organism(self, org: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "ncbiTaxonomyId": org.get("ncbiTaxonomyId"),
            "species": org.get("taxonomicLevelSpecies"),
            "genus": org.get("taxonomicLevelGenus"),
            "commonName": org.get("commonName"),
            "assemblyCount": org.get("assemblyCount"),
            "taxonomicGroup": org.get("taxonomicGroup"),
            "strain": org.get("taxonomicLevelStrain"),
            "priority": org.get("priority"),
        }

    # -- Assembly methods --

    def get_assemblies_for_organism(self, taxonomy_id: str) -> List[Dict[str, Any]]:
        assemblies = self._assemblies_by_tax_id.get(str(taxonomy_id), [])
        return [self._condense_assembly(a) for a in assemblies]

    def get_assembly_details(self, accession: str) -> Optional[Dict[str, Any]]:
        asm = self._assemblies_by_accession.get(accession)
        if asm:
            return self._condense_assembly(asm)
        return None

    def _condense_assembly(self, asm: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "accession": asm.get("accession"),
            "species": asm.get("taxonomicLevelSpecies"),
            "strain": asm.get("strainName"),
            "ncbiTaxonomyId": asm.get("ncbiTaxonomyId"),
            "level": asm.get("level"),
            "ploidy": asm.get("ploidy"),
            "isRef": asm.get("isRef"),
            "coverage": asm.get("coverage"),
            "length": asm.get("length"),
            "gcPercent": asm.get("gcPercent"),
            "scaffoldCount": asm.get("scaffoldCount"),
            "chromosomes": asm.get("chromosomes"),
            "annotationStatus": asm.get("annotationStatus"),
            "geneModelUrl": asm.get("geneModelUrl"),
            "ucscBrowserUrl": asm.get("ucscBrowserUrl"),
        }

    # -- Workflow methods --

    def get_workflow_categories(self) -> List[Dict[str, Any]]:
        return [
            {
                "category": cat.get("category"),
                "name": cat.get("name"),
                "description": cat.get("description"),
                "workflowCount": len(cat.get("workflows", [])),
            }
            for cat in self.workflow_categories
        ]

    def get_workflows_in_category(self, category: str) -> List[Dict[str, Any]]:
        cat_lower = category.lower()
        for cat in self.workflow_categories:
            if (
                cat.get("category", "").lower() == cat_lower
                or cat.get("name", "").lower() == cat_lower
            ):
                return [self._condense_workflow(wf) for wf in cat.get("workflows", [])]
        return []

    def get_compatible_workflows(
        self, ploidies: List[str], taxonomy_id: str = ""
    ) -> List[Dict[str, Any]]:
        """Find workflows compatible with given ploidies and optional taxonomy ID."""
        results = []
        for cat in self.workflow_categories:
            for wf in cat.get("workflows", []):
                wf_ploidy = wf.get("ploidy")
                wf_tax = wf.get("taxonomyId")
                # Ploidy must match (None means universal)
                if wf_ploidy is not None and wf_ploidy not in ploidies:
                    continue
                # Taxonomy must match if specified on both sides
                if (
                    taxonomy_id
                    and wf_tax is not None
                    and str(wf_tax) != str(taxonomy_id)
                ):
                    continue
                results.append(self._condense_workflow(wf))
        return results

    def get_workflow_details(self, iwc_id: str) -> Optional[Dict[str, Any]]:
        wf = self._workflows_by_iwc_id.get(iwc_id)
        if wf:
            return self._condense_workflow(wf)
        return None

    def check_workflow_assembly_compatibility(
        self, iwc_id: str, accession: str
    ) -> Dict[str, Any]:
        wf = self._workflows_by_iwc_id.get(iwc_id)
        asm = self._assemblies_by_accession.get(accession)
        if not wf:
            return {"compatible": False, "reason": f"Workflow '{iwc_id}' not found"}
        if not asm:
            return {"compatible": False, "reason": f"Assembly '{accession}' not found"}

        issues = []
        wf_ploidy = wf.get("ploidy")
        asm_ploidy = asm.get("ploidy")
        if wf_ploidy is not None and asm_ploidy != wf_ploidy:
            issues.append(
                f"Ploidy mismatch: workflow requires "
                f"'{wf_ploidy}', assembly is '{asm_ploidy}'"
            )

        wf_tax = wf.get("taxonomyId")
        asm_lineage = asm.get("lineageTaxonomyIds", [])
        if wf_tax is not None and str(wf_tax) not in [str(t) for t in asm_lineage]:
            issues.append(
                f"Taxonomy mismatch: workflow targets taxonomy {wf_tax}, "
                f"assembly taxonomy is {asm.get('ncbiTaxonomyId')}"
            )

        if issues:
            return {"compatible": False, "reason": "; ".join(issues)}
        return {
            "compatible": True,
            "workflow": wf.get("workflowName"),
            "assembly": accession,
        }

    def _condense_workflow(self, wf: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "iwcId": wf.get("iwcId"),
            "name": wf.get("workflowName"),
            "description": wf.get("workflowDescription"),
            "category": wf.get("_category", ""),
            "ploidy": wf.get("ploidy"),
            "taxonomyId": wf.get("taxonomyId"),
            "trsId": wf.get("trsId"),
        }
