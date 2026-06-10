"""In-memory catalog data loaded from the built JSON files.

Provides search and lookup methods used by the assistant agent's tools.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)

# NOTE: the workflow/organism compatibility rule (taxonomy lineage + ploidy +
# assembly-id requirement) below is duplicated in three other places that drift
# out of sync -- the MCP server's catalog_data.py, the frontend's
# AnalyzeWorkflowsView/components/Main/utils.ts, and the catalog build's
# build-workflow-mappings.ts. #1319 was caused by that drift. Consolidating to a
# single source of truth is tracked in #1327; until then, change all four together.

# Ploidy compatibility: a workflow is compatible when its ploidy is ANY
# or matches at least one of the organism's ploidy values.
_PLOIDY_ANY = "ANY"


def _is_assembly_scope(wf: Dict[str, Any]) -> bool:
    """The assistant only drives the single-organism/single-assembly flow, so it
    only sees ASSEMBLY-scope workflows (matching the frontend's default view).
    Organism- and comparative-scoped workflows are hidden from it. A workflow
    with no scope set is treated as ASSEMBLY, matching the MCP server's
    CatalogData."""
    return (wf.get("scope") or "ASSEMBLY") == "ASSEMBLY"


class CatalogData:
    def __init__(self, catalog_path: str):
        self.catalog_path = Path(catalog_path)
        self.organisms: List[Dict[str, Any]] = []
        self.workflows_by_category: List[Dict[str, Any]] = []
        # Maps each taxonomy ID to its own ancestor lineage -- the IDs from the
        # root down to and including itself, never its descendants -- so a
        # workflow annotated with an ancestor taxon (e.g. Bacteria=2) matches
        # every organism below it (e.g. E. coli=562). Built from genome lineages.
        self._lineage_by_tax_id: Dict[str, Set[str]] = {}
        self._load()

    def _load(self) -> None:
        self._load_organisms()
        self._load_workflows()
        self._build_lineage_index()

    def _build_lineage_index(self) -> None:
        """Index each taxonomy ID to its own ancestor lineage (root..tid).

        Lets ancestor lookups answer "is Bacteria (2) in E. coli's (562)
        lineage?" so a workflow targeting a higher-rank taxon applies to all
        taxa below it. lineageTaxonomyIds is root-first, so each ID maps only
        to the prefix up to and including itself -- mapping it to the full
        lineage would pollute ancestor keys with their descendants (key "2"
        would contain "562"), wrongly matching a descendant-targeted workflow
        against a higher-rank organism. When several genomes share a tax ID
        their ancestor sets are merged.
        """
        for org in self.organisms:
            for genome in org.get("genomes", []):
                lineage = genome.get("lineageTaxonomyIds") or []
                if not lineage:
                    continue
                lineage_strs = [str(t) for t in lineage]
                for i, tid in enumerate(lineage_strs):
                    ancestors = set(lineage_strs[: i + 1])
                    existing = self._lineage_by_tax_id.get(tid)
                    if existing is None:
                        self._lineage_by_tax_id[tid] = ancestors
                    else:
                        existing.update(ancestors)

    def _workflow_taxon_matches(
        self, workflow_tax_id: Any, target_tax_id: Optional[str]
    ) -> bool:
        """True if an organism-specific workflow applies to target_tax_id.

        A match means the workflow's taxon is anywhere in target_tax_id's
        lineage -- a workflow for Bacteria (2) applies to E. coli (562) and
        every other taxon below it. Returns False when there's no organism to
        check against or its lineage is unknown.
        """
        if not target_tax_id:
            return False
        lineage = self._lineage_by_tax_id.get(str(target_tax_id), set())
        return str(workflow_tax_id) in lineage

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

    def find_organism_exact(self, name: Any) -> Optional[Dict[str, Any]]:
        """Find an organism by its NCBI taxonomy id -- the stable, canonical key
        suggestion chips tag organisms with (#1297). An exact (case-insensitive)
        species or common name is also accepted as a fail-soft fallback so a chip
        the model mis-tags by name isn't needlessly dropped.

        Accepts any input (e.g. a numeric taxid or None); the value is coerced
        to a string before matching.

        Unlike search_organisms, this does NOT match on genus or substrings, so
        a genus ("Candida") or a partial string ("almonella") will not resolve.
        """
        if name is None:
            return None
        q = str(name).strip().lower()
        if not q:
            return None
        for org in self.organisms:
            candidates = {
                (org.get("taxonomicLevelSpecies") or "").lower(),
                (org.get("commonName") or "").lower(),
                str(org.get("ncbiTaxonomyId") or "").lower(),
            }
            candidates.discard("")
            if q in candidates:
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
                "workflow_count": sum(
                    1 for wf in cat.get("workflows", []) if _is_assembly_scope(wf)
                ),
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
                    if _is_assembly_scope(wf)
                ]
        return []

    def get_compatible_workflows(
        self, organism_ploidies: List[str], taxonomy_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Return workflows compatible with the given organism ploidies and taxonomy."""
        results = []
        for cat in self.workflows_by_category:
            for wf in cat.get("workflows", []):
                if not _is_assembly_scope(wf):
                    continue
                wf_ploidy = wf.get("ploidy", _PLOIDY_ANY)
                wf_tax = wf.get("taxonomyId")

                ploidy_ok = wf_ploidy == _PLOIDY_ANY or wf_ploidy in organism_ploidies
                tax_ok = wf_tax is None or self._workflow_taxon_matches(
                    wf_tax, taxonomy_id
                )

                if ploidy_ok and tax_ok:
                    results.append(self._summarize_workflow(wf, cat.get("name", "")))
        return results

    def get_workflow_details(self, iwc_id: str) -> Optional[Dict[str, Any]]:
        for cat in self.workflows_by_category:
            for wf in cat.get("workflows", []):
                if wf.get("iwcId") == iwc_id and _is_assembly_scope(wf):
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

        # Taxonomy check: the workflow's taxon must be in the assembly's
        # lineage, so a Bacteria-targeted workflow matches any bacterium.
        wf_tax = wf.get("taxonomy_id")
        if wf_tax and not self._workflow_taxon_matches(wf_tax, asm.get("taxonomy_id")):
            issues.append(
                f"Workflow is organism-specific (taxonomy {wf_tax}), but that "
                f"taxon is not in the lineage of assembly taxonomy "
                f"{asm.get('taxonomy_id')}"
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
