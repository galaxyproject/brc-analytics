"""In-memory catalog data loaded from the built JSON files.

Provides search and lookup methods used by the assistant agent's tools.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Ploidy compatibility: a workflow is compatible when its ploidy is ANY
# or matches at least one of the organism's ploidy values.
_PLOIDY_ANY = "ANY"


class CatalogData:
    def __init__(self, catalog_path: str):
        self.catalog_path = Path(catalog_path)
        self.organisms: List[Dict[str, Any]] = []
        self.workflows_by_category: List[Dict[str, Any]] = []
        self._load()

    def _load(self) -> None:
        self._load_organisms()
        self._load_workflows()

    def _load_organisms(self) -> None:
        path = self.catalog_path / "organisms.json"
        if not path.exists():
            logger.warning(f"organisms.json not found at {path}")
            return
        try:
            with open(path) as f:
                self.organisms = json.load(f)
            logger.info(f"Loaded {len(self.organisms)} organisms from catalog")
        except Exception:
            logger.exception("Failed to load organisms.json")

    def _load_workflows(self) -> None:
        path = self.catalog_path / "workflows.json"
        if not path.exists():
            logger.warning(f"workflows.json not found at {path}")
            return
        try:
            with open(path) as f:
                self.workflows_by_category = json.load(f)
            total = sum(
                len(cat.get("workflows", [])) for cat in self.workflows_by_category
            )
            logger.info(
                f"Loaded {total} workflows in "
                f"{len(self.workflows_by_category)} categories"
            )
        except Exception:
            logger.exception("Failed to load workflows.json")

    # ------------------------------------------------------------------
    # Organism queries
    # ------------------------------------------------------------------

    def search_organisms(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search organisms by species name, common name, or taxonomy ID."""
        q = query.lower().strip()
        results = []
        for org in self.organisms:
            species = (org.get("taxonomicLevelSpecies") or "").lower()
            common = (org.get("commonName") or "").lower()
            tax_id = str(org.get("ncbiTaxonomyId") or "")
            genus = (org.get("taxonomicLevelGenus") or "").lower()

            if q in species or q in common or q == tax_id or q in genus:
                results.append(self._summarize_organism(org))
                if len(results) >= limit:
                    break
        return results

    def get_organism_by_taxonomy_id(self, taxonomy_id: str) -> Optional[Dict[str, Any]]:
        for org in self.organisms:
            if str(org.get("ncbiTaxonomyId")) == str(taxonomy_id):
                return self._summarize_organism(org)
        return None

    def _summarize_organism(self, org: Dict[str, Any]) -> Dict[str, Any]:
        """Return a compact summary suitable for LLM context."""
        genomes = org.get("genomes", [])
        ref_genomes = [g for g in genomes if g.get("isRef") == "Yes"]
        has_gtf = any(g.get("geneModelUrl") for g in genomes)
        ploidies = set()
        for g in genomes:
            for p in g.get("ploidy", []):
                ploidies.add(p)

        return {
            "species": org.get("taxonomicLevelSpecies"),
            "common_name": org.get("commonName"),
            "taxonomy_id": str(org.get("ncbiTaxonomyId")),
            "assembly_count": org.get("assemblyCount", len(genomes)),
            "reference_assembly_count": len(ref_genomes),
            "has_gene_annotation": has_gtf,
            "ploidies": sorted(ploidies),
            "taxonomic_group": org.get("taxonomicGroup", []),
            "genus": org.get("taxonomicLevelGenus"),
            "family": org.get("taxonomicLevelFamily"),
        }

    # ------------------------------------------------------------------
    # Assembly queries
    # ------------------------------------------------------------------

    def get_assemblies_for_organism(self, taxonomy_id: str) -> List[Dict[str, Any]]:
        for org in self.organisms:
            if str(org.get("ncbiTaxonomyId")) == str(taxonomy_id):
                return [self._summarize_assembly(g) for g in org.get("genomes", [])]
        return []

    def get_assembly_details(self, accession: str) -> Optional[Dict[str, Any]]:
        accession = accession.strip()
        for org in self.organisms:
            for g in org.get("genomes", []):
                if g.get("accession") == accession:
                    return self._summarize_assembly(g)
        return None

    def _summarize_assembly(self, g: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "accession": g.get("accession"),
            "species": g.get("taxonomicLevelSpecies"),
            "strain": g.get("strainName") or g.get("taxonomicLevelStrain"),
            "is_reference": g.get("isRef") == "Yes",
            "level": g.get("level"),
            "ploidy": g.get("ploidy", []),
            "length": g.get("length"),
            "scaffold_count": g.get("scaffoldCount"),
            "scaffold_n50": g.get("scaffoldN50"),
            "gc_percent": g.get("gcPercent"),
            "has_gene_annotation": bool(g.get("geneModelUrl")),
            "gene_model_url": g.get("geneModelUrl"),
            "ucsc_browser_url": g.get("ucscBrowserUrl"),
            "taxonomy_id": str(g.get("ncbiTaxonomyId", "")),
            "species_taxonomy_id": str(g.get("speciesTaxonomyId", "")),
        }

    # ------------------------------------------------------------------
    # Workflow queries
    # ------------------------------------------------------------------

    def get_workflow_categories(self) -> List[Dict[str, Any]]:
        """Return a list of workflow categories with counts."""
        return [
            {
                "category": cat.get("category"),
                "name": cat.get("name"),
                "description": cat.get("description"),
                "workflow_count": len(cat.get("workflows", [])),
            }
            for cat in self.workflows_by_category
        ]

    def get_workflows_in_category(self, category: str) -> List[Dict[str, Any]]:
        cat_upper = category.upper().replace(" ", "_")
        for cat in self.workflows_by_category:
            if (cat.get("category") or "").upper() == cat_upper:
                return [
                    self._summarize_workflow(wf, cat.get("name", ""))
                    for wf in cat.get("workflows", [])
                ]
        return []

    def get_compatible_workflows(
        self, organism_ploidies: List[str], taxonomy_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Return workflows compatible with the given organism ploidies and taxonomy."""
        results = []
        for cat in self.workflows_by_category:
            for wf in cat.get("workflows", []):
                wf_ploidy = wf.get("ploidy", _PLOIDY_ANY)
                wf_tax = wf.get("taxonomyId")

                ploidy_ok = wf_ploidy == _PLOIDY_ANY or wf_ploidy in organism_ploidies
                tax_ok = wf_tax is None or (
                    taxonomy_id and str(wf_tax) == str(taxonomy_id)
                )

                if ploidy_ok and tax_ok:
                    results.append(self._summarize_workflow(wf, cat.get("name", "")))
        return results

    def get_workflow_details(self, iwc_id: str) -> Optional[Dict[str, Any]]:
        for cat in self.workflows_by_category:
            for wf in cat.get("workflows", []):
                if wf.get("iwcId") == iwc_id:
                    return self._summarize_workflow(
                        wf, cat.get("name", ""), include_params=True
                    )
        return None

    def _summarize_workflow(
        self,
        wf: Dict[str, Any],
        category_name: str,
        include_params: bool = False,
    ) -> Dict[str, Any]:
        params = wf.get("parameters", [])
        needs_paired = any(
            p.get("data_requirements", {}).get("library_layout") == "PAIRED"
            for p in params
        )
        needs_single = any("single" in (p.get("key") or "").lower() for p in params)
        needs_gene_annotation = any(
            p.get("variable") == "GENE_MODEL_URL" for p in params
        )

        summary: Dict[str, Any] = {
            "iwc_id": wf.get("iwcId"),
            "name": wf.get("workflowName"),
            "description": wf.get("workflowDescription"),
            "category": category_name,
            "ploidy": wf.get("ploidy"),
            "taxonomy_id": wf.get("taxonomyId"),
            "trs_id": wf.get("trsId"),
            "needs_paired_end_data": needs_paired,
            "needs_single_end_data": needs_single,
            "needs_gene_annotation": needs_gene_annotation,
        }
        if include_params:
            summary["parameters"] = params
        return summary

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    def check_workflow_assembly_compatibility(
        self, iwc_id: str, accession: str
    ) -> Dict[str, Any]:
        """Check if a workflow and assembly are compatible (ploidy, taxonomy, GTF)."""
        wf = self.get_workflow_details(iwc_id)
        asm = self.get_assembly_details(accession)
        if not wf or not asm:
            return {
                "compatible": False,
                "reason": "Workflow or assembly not found in catalog.",
            }

        issues = []

        # Ploidy check
        wf_ploidy = wf.get("ploidy", _PLOIDY_ANY)
        asm_ploidies = asm.get("ploidy", [])
        if wf_ploidy != _PLOIDY_ANY and wf_ploidy not in asm_ploidies:
            issues.append(
                f"Workflow requires {wf_ploidy} but assembly is {', '.join(asm_ploidies)}"
            )

        # Taxonomy check
        wf_tax = wf.get("taxonomy_id")
        if wf_tax and str(wf_tax) != asm.get("taxonomy_id"):
            issues.append(
                f"Workflow is organism-specific (taxonomy {wf_tax}) "
                f"but assembly has taxonomy {asm.get('taxonomy_id')}"
            )

        # Gene annotation check
        if wf.get("needs_gene_annotation") and not asm.get("has_gene_annotation"):
            issues.append(
                "Workflow requires a gene annotation (GTF) but this assembly "
                "doesn't have one available."
            )

        return {
            "compatible": len(issues) == 0,
            "issues": issues,
            "workflow": wf.get("name"),
            "assembly": accession,
        }
