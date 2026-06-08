"""Tests for CatalogData search and lookup methods."""

import json
import os
import tempfile

import pytest

from app.services.tools.catalog_data import CatalogData

SAMPLE_ORGANISMS = [
    {
        "ncbiTaxonomyId": 5833,
        "taxonomicLevelSpecies": "Plasmodium falciparum",
        "taxonomicLevelGenus": "Plasmodium",
        "taxonomicLevelFamily": "Plasmodiidae",
        "commonName": "malaria parasite",
        "assemblyCount": 2,
        "taxonomicGroup": ["Apicomplexa"],
        "genomes": [
            {
                "accession": "GCF_000002765.6",
                "taxonomicLevelSpecies": "Plasmodium falciparum",
                "isRef": "Yes",
                "level": "Chromosome",
                "ploidy": ["HAPLOID"],
                "length": 23332831,
                "scaffoldCount": 16,
                "scaffoldN50": 1687656,
                "gcPercent": 19.4,
                "geneModelUrl": "https://example.com/pf.gtf",
                "ucscBrowserUrl": "https://genome.ucsc.edu/cgi-bin/hgTracks?db=pf",
                "ncbiTaxonomyId": 5833,
                "speciesTaxonomyId": 5833,
            },
            {
                "accession": "GCA_000002765.3",
                "taxonomicLevelSpecies": "Plasmodium falciparum",
                "isRef": "No",
                "level": "Scaffold",
                "ploidy": ["HAPLOID"],
                "length": 22000000,
                "scaffoldCount": 100,
                "scaffoldN50": 500000,
                "gcPercent": 19.5,
                "ncbiTaxonomyId": 5833,
                "speciesTaxonomyId": 5833,
            },
        ],
    },
    {
        "ncbiTaxonomyId": 559292,
        "taxonomicLevelSpecies": "Saccharomyces cerevisiae",
        "taxonomicLevelGenus": "Saccharomyces",
        "taxonomicLevelFamily": "Saccharomycetaceae",
        "commonName": "yeast",
        "assemblyCount": 1,
        "taxonomicGroup": ["Fungi"],
        "genomes": [
            {
                "accession": "GCF_000146045.2",
                "taxonomicLevelSpecies": "Saccharomyces cerevisiae",
                "isRef": "Yes",
                "level": "Chromosome",
                "ploidy": ["HAPLOID"],
                "length": 12157105,
                "scaffoldCount": 17,
                "scaffoldN50": 924431,
                "gcPercent": 38.2,
                "geneModelUrl": "https://example.com/sc.gtf",
                "ncbiTaxonomyId": 559292,
                "speciesTaxonomyId": 559292,
            },
        ],
    },
]

SAMPLE_WORKFLOWS = [
    {
        "category": "TRANSCRIPTOMICS",
        "name": "Transcriptomics",
        "description": "RNA-Seq analysis workflows",
        "workflows": [
            {
                "iwcId": "rnaseq-pe",
                "workflowName": "RNA-Seq Paired End",
                "workflowDescription": "PE RNA-Seq analysis",
                "scope": "ASSEMBLY",
                "ploidy": "ANY",
                "trsId": "#workflow/github.com/iwc/rnaseq-pe/main",
                "parameters": [
                    {"variable": "GENE_MODEL_URL", "key": "gene_model"},
                ],
            },
        ],
    },
    {
        "category": "VARIANT_CALLING",
        "name": "Variant Calling",
        "description": "SNP/variant detection",
        "workflows": [
            {
                "iwcId": "varcall-haploid",
                "workflowName": "Variant Calling (Haploid)",
                "workflowDescription": "Haploid variant calling",
                "scope": "ASSEMBLY",
                "ploidy": "HAPLOID",
                "trsId": "#workflow/github.com/iwc/varcall-haploid/main",
                "taxonomyId": None,
                "parameters": [],
            },
            {
                "iwcId": "varcall-diploid",
                "workflowName": "Variant Calling (Diploid)",
                "workflowDescription": "Diploid variant calling",
                "scope": "ASSEMBLY",
                "ploidy": "DIPLOID",
                "trsId": "#workflow/github.com/iwc/varcall-diploid/main",
                "taxonomyId": None,
                "parameters": [],
            },
            {
                # ORGANISM-scope (assembly-building) workflow: ANY ploidy and no
                # taxonomy restriction, so it WOULD match if scope were ignored.
                # The assistant can't drive its 0/2+-assembly flow, so it must be
                # hidden from every catalog tool (#1321).
                "iwcId": "assembly-with-flye",
                "workflowName": "Assembly with Flye",
                "workflowDescription": "Long-read de novo genome assembly",
                "scope": "ORGANISM",
                "ploidy": "ANY",
                "trsId": "#workflow/github.com/iwc/assembly-with-flye/main",
                "taxonomyId": None,
                "parameters": [],
            },
        ],
    },
]


@pytest.fixture()
def catalog(tmp_path):
    """Write sample JSON files and return a CatalogData instance."""
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(SAMPLE_WORKFLOWS))
    return CatalogData(str(tmp_path))


# ---------- Organism search ----------


class TestSearchOrganisms:
    def test_search_by_species(self, catalog):
        results = catalog.search_organisms("plasmodium")
        assert len(results) == 1
        assert results[0]["species"] == "Plasmodium falciparum"

    def test_search_by_common_name(self, catalog):
        results = catalog.search_organisms("yeast")
        assert len(results) == 1
        assert results[0]["taxonomy_id"] == "559292"

    def test_search_by_taxonomy_id(self, catalog):
        results = catalog.search_organisms("5833")
        assert len(results) == 1
        assert results[0]["species"] == "Plasmodium falciparum"

    def test_search_by_genus(self, catalog):
        results = catalog.search_organisms("saccharomyces")
        assert len(results) == 1

    def test_search_no_results(self, catalog):
        results = catalog.search_organisms("nonexistent_organism_xyz")
        assert results == []

    def test_search_limit(self, catalog):
        results = catalog.search_organisms("a", limit=1)
        assert len(results) <= 1

    def test_search_case_insensitive(self, catalog):
        results = catalog.search_organisms("PLASMODIUM")
        assert len(results) == 1

    def test_organism_summary_fields(self, catalog):
        results = catalog.search_organisms("5833")
        org = results[0]
        assert org["assembly_count"] == 2
        assert org["reference_assembly_count"] == 1
        assert org["has_gene_annotation"] is True
        assert "HAPLOID" in org["ploidies"]


# ---------- find_organism_exact (catalog grounding, #1297) ----------


class TestFindOrganismExact:
    def test_exact_species_match(self, catalog):
        org = catalog.find_organism_exact("Plasmodium falciparum")
        assert org is not None
        assert org["species"] == "Plasmodium falciparum"

    def test_case_insensitive(self, catalog):
        assert catalog.find_organism_exact("plasmodium falciparum") is not None

    def test_common_name_match(self, catalog):
        assert catalog.find_organism_exact("malaria parasite") is not None

    def test_taxonomy_id_match(self, catalog):
        assert catalog.find_organism_exact("5833") is not None

    def test_non_string_taxid_input(self, catalog):
        # Robust to a non-string caller (e.g. a numeric taxid from a chip tag).
        assert catalog.find_organism_exact(5833) is not None
        assert catalog.find_organism_exact(None) is None

    def test_genus_alone_does_not_match(self, catalog):
        # search_organisms matches genus; find_organism_exact must NOT -- this is
        # the false-positive that let ungrounded species through (#1297).
        assert catalog.search_organisms("Plasmodium")  # fuzzy still matches
        assert catalog.find_organism_exact("Plasmodium") is None

    def test_partial_string_does_not_match(self, catalog):
        assert catalog.find_organism_exact("Plasmod") is None
        assert catalog.find_organism_exact("falciparum") is None

    def test_absent_organism_returns_none(self, catalog):
        assert catalog.find_organism_exact("Candida glabrata") is None

    def test_blank_returns_none(self, catalog):
        assert catalog.find_organism_exact("") is None
        assert catalog.find_organism_exact("   ") is None


# ---------- Assembly queries ----------


class TestAssemblyQueries:
    def test_get_assemblies_for_organism(self, catalog):
        assemblies = catalog.get_assemblies_for_organism("5833")
        assert len(assemblies) == 2
        accessions = {a["accession"] for a in assemblies}
        assert "GCF_000002765.6" in accessions

    def test_get_assemblies_not_found(self, catalog):
        assert catalog.get_assemblies_for_organism("99999") == []

    def test_get_assembly_details(self, catalog):
        details = catalog.get_assembly_details("GCF_000146045.2")
        assert details is not None
        assert details["is_reference"] is True
        assert details["has_gene_annotation"] is True
        assert details["taxonomy_id"] == "559292"

    def test_get_assembly_details_not_found(self, catalog):
        assert catalog.get_assembly_details("GCF_BOGUS") is None

    def test_assembly_detail_fields(self, catalog):
        details = catalog.get_assembly_details("GCF_000002765.6")
        assert details["level"] == "Chromosome"
        assert "HAPLOID" in details["ploidy"]
        assert details["gc_percent"] == 19.4


# ---------- Workflow queries ----------


class TestWorkflowQueries:
    def test_get_workflow_categories(self, catalog):
        cats = catalog.get_workflow_categories()
        assert len(cats) == 2
        names = {c["category"] for c in cats}
        assert "TRANSCRIPTOMICS" in names
        assert "VARIANT_CALLING" in names

    def test_category_counts(self, catalog):
        cats = catalog.get_workflow_categories()
        by_cat = {c["category"]: c for c in cats}
        assert by_cat["TRANSCRIPTOMICS"]["workflow_count"] == 1
        assert by_cat["VARIANT_CALLING"]["workflow_count"] == 2

    def test_get_workflows_in_category(self, catalog):
        wfs = catalog.get_workflows_in_category("VARIANT_CALLING")
        assert len(wfs) == 2

    def test_get_workflows_case_insensitive(self, catalog):
        wfs = catalog.get_workflows_in_category("variant_calling")
        assert len(wfs) == 2

    def test_get_workflows_not_found(self, catalog):
        assert catalog.get_workflows_in_category("NONEXISTENT") == []

    def test_get_workflow_details(self, catalog):
        details = catalog.get_workflow_details("rnaseq-pe")
        assert details is not None
        assert details["name"] == "RNA-Seq Paired End"
        assert details["needs_gene_annotation"] is True

    def test_get_workflow_details_not_found(self, catalog):
        assert catalog.get_workflow_details("bogus-id") is None

    def test_compatible_workflows_haploid(self, catalog):
        wfs = catalog.get_compatible_workflows(["HAPLOID"])
        iwc_ids = {w["iwc_id"] for w in wfs}
        assert "rnaseq-pe" in iwc_ids  # ANY ploidy
        assert "varcall-haploid" in iwc_ids
        assert "varcall-diploid" not in iwc_ids

    def test_compatible_workflows_diploid(self, catalog):
        wfs = catalog.get_compatible_workflows(["DIPLOID"])
        iwc_ids = {w["iwc_id"] for w in wfs}
        assert "rnaseq-pe" in iwc_ids
        assert "varcall-diploid" in iwc_ids
        assert "varcall-haploid" not in iwc_ids

    def test_compatible_workflows_both_ploidies(self, catalog):
        wfs = catalog.get_compatible_workflows(["HAPLOID", "DIPLOID"])
        iwc_ids = {w["iwc_id"] for w in wfs}
        assert "varcall-haploid" in iwc_ids
        assert "varcall-diploid" in iwc_ids


# ---------- Compatibility check ----------


class TestCompatibilityCheck:
    def test_compatible(self, catalog):
        result = catalog.check_workflow_assembly_compatibility(
            "varcall-haploid", "GCF_000002765.6"
        )
        assert result["compatible"] is True
        assert result["issues"] == []

    def test_ploidy_mismatch(self, catalog):
        result = catalog.check_workflow_assembly_compatibility(
            "varcall-diploid", "GCF_000002765.6"
        )
        assert result["compatible"] is False
        assert any("DIPLOID" in issue for issue in result["issues"])

    def test_annotation_missing(self, catalog):
        result = catalog.check_workflow_assembly_compatibility(
            "rnaseq-pe", "GCA_000002765.3"
        )
        assert result["compatible"] is False
        assert any("annotation" in issue.lower() for issue in result["issues"])

    def test_not_found(self, catalog):
        result = catalog.check_workflow_assembly_compatibility(
            "bogus", "GCF_000002765.6"
        )
        assert result["compatible"] is False
        assert "not found" in result["reason"].lower()


# ---------- Scope filtering (#1321) ----------


class TestScopeFiltering:
    """Non-ASSEMBLY-scope workflows are hidden from every assistant tool.

    The assistant only drives the single-organism/single-assembly flow, so
    ORGANISM- and comparative-scope workflows it can't drive must not surface
    (matching the frontend's default ASSEMBLY-only view).
    """

    def test_organism_scope_absent_from_category_listing(self, catalog):
        wfs = catalog.get_workflows_in_category("VARIANT_CALLING")
        iwc_ids = {w["iwc_id"] for w in wfs}
        assert "assembly-with-flye" not in iwc_ids
        # only the two ASSEMBLY-scope workflows remain
        assert len(wfs) == 2

    def test_organism_scope_absent_from_compatible(self, catalog):
        # ANY ploidy + no taxonomy restriction would match if scope were ignored.
        wfs = catalog.get_compatible_workflows(["HAPLOID"])
        iwc_ids = {w["iwc_id"] for w in wfs}
        assert "assembly-with-flye" not in iwc_ids

    def test_organism_scope_details_returns_none(self, catalog):
        assert catalog.get_workflow_details("assembly-with-flye") is None

    def test_organism_scope_not_counted_in_categories(self, catalog):
        by_cat = {c["category"]: c for c in catalog.get_workflow_categories()}
        # VARIANT_CALLING holds 3 raw workflows but one is ORGANISM-scope.
        assert by_cat["VARIANT_CALLING"]["workflow_count"] == 2

    def test_missing_scope_defaults_to_assembly(self, tmp_path):
        # A workflow with no scope field is treated as ASSEMBLY (frontend default).
        workflows = [
            {
                "category": "OTHER",
                "name": "Other",
                "description": "No-scope workflow",
                "workflows": [
                    {
                        "iwcId": "no-scope-wf",
                        "workflowName": "Scopeless",
                        "workflowDescription": "Has no scope field",
                        "ploidy": "ANY",
                        "trsId": "#workflow/github.com/iwc/no-scope/main",
                        "parameters": [],
                    },
                ],
            },
        ]
        (tmp_path / "organisms.json").write_text(json.dumps([]))
        (tmp_path / "workflows.json").write_text(json.dumps(workflows))
        c = CatalogData(str(tmp_path))
        assert c.get_workflow_details("no-scope-wf") is not None
        assert c.get_workflow_categories()[0]["workflow_count"] == 1


# ---------- Lineage-based taxonomy matching (#1319) ----------

LINEAGE_ORGANISMS = [
    {
        "ncbiTaxonomyId": 562,
        "taxonomicLevelSpecies": "Escherichia coli",
        "taxonomicLevelGenus": "Escherichia",
        "commonName": "E. coli",
        "assemblyCount": 1,
        "taxonomicGroup": ["Bacteria"],
        "genomes": [
            {
                "accession": "GCF_000005845.2",
                "taxonomicLevelSpecies": "Escherichia coli",
                "isRef": "Yes",
                "level": "Complete Genome",
                "ploidy": ["HAPLOID"],
                "geneModelUrl": "https://example.com/ecoli.gtf",
                "ncbiTaxonomyId": 562,
                "speciesTaxonomyId": 562,
                # Bacteria (2) is an ancestor of E. coli (562)
                "lineageTaxonomyIds": ["1", "131567", "2", "1224", "561", "562"],
            },
        ],
    },
    {
        "ncbiTaxonomyId": 559292,
        "taxonomicLevelSpecies": "Saccharomyces cerevisiae",
        "taxonomicLevelGenus": "Saccharomyces",
        "commonName": "yeast",
        "assemblyCount": 1,
        "taxonomicGroup": ["Fungi"],
        "genomes": [
            {
                "accession": "GCF_000146045.2",
                "taxonomicLevelSpecies": "Saccharomyces cerevisiae",
                "isRef": "Yes",
                "level": "Chromosome",
                "ploidy": ["HAPLOID"],
                "ncbiTaxonomyId": 559292,
                "speciesTaxonomyId": 559292,
                # Fungal lineage -- Bacteria (2) is NOT present
                "lineageTaxonomyIds": ["1", "131567", "2759", "4751", "4932", "559292"],
            },
        ],
    },
]

LINEAGE_WORKFLOWS = [
    {
        "category": "ANNOTATION",
        "name": "Annotation",
        "description": "Annotation workflows",
        "workflows": [
            {
                "iwcId": "amr-gene-detection",
                "workflowName": "AMR Gene Detection",
                "workflowDescription": "Bacterial AMR gene detection",
                "ploidy": "HAPLOID",
                "taxonomyId": 2,  # Bacteria -- applies to all descendant taxa
                "trsId": "#workflow/github.com/iwc/amr/main",
                "parameters": [],
            },
            {
                "iwcId": "generic-assembly",
                "workflowName": "Generic Assembly",
                "workflowDescription": "Taxon-agnostic assembly",
                "ploidy": "ANY",
                "taxonomyId": None,
                "trsId": "#workflow/github.com/iwc/assembly/main",
                "parameters": [],
            },
        ],
    },
]


@pytest.fixture()
def lineage_catalog(tmp_path):
    (tmp_path / "organisms.json").write_text(json.dumps(LINEAGE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(LINEAGE_WORKFLOWS))
    return CatalogData(str(tmp_path))


class TestLineageTaxonomyMatching:
    def test_compatible_includes_ancestor_targeted_workflow(self, lineage_catalog):
        # E. coli (562); AMR workflow targets Bacteria (2), which is in its
        # lineage, so it should be returned even though 2 != 562.
        wfs = lineage_catalog.get_compatible_workflows(["HAPLOID"], taxonomy_id="562")
        iwc_ids = {w["iwc_id"] for w in wfs}
        assert "amr-gene-detection" in iwc_ids

    def test_compatible_excludes_unrelated_lineage(self, lineage_catalog):
        # Yeast (559292) is a fungus; Bacteria (2) is not in its lineage, so
        # the Bacteria-targeted AMR workflow should not be returned.
        wfs = lineage_catalog.get_compatible_workflows(
            ["HAPLOID"], taxonomy_id="559292"
        )
        iwc_ids = {w["iwc_id"] for w in wfs}
        assert "amr-gene-detection" not in iwc_ids

    def test_check_compatible_with_descendant_assembly(self, lineage_catalog):
        result = lineage_catalog.check_workflow_assembly_compatibility(
            "amr-gene-detection", "GCF_000005845.2"
        )
        assert result["compatible"] is True
        assert result["issues"] == []

    def test_check_incompatible_with_unrelated_assembly(self, lineage_catalog):
        result = lineage_catalog.check_workflow_assembly_compatibility(
            "amr-gene-detection", "GCF_000146045.2"
        )
        assert result["compatible"] is False
        assert any("taxonom" in issue.lower() for issue in result["issues"])

    def test_ancestor_index_excludes_descendants(self, lineage_catalog):
        # Bacteria (2) is an ancestor of E. coli (562). The lineage index for an
        # ancestor must not pull in its descendants, or a workflow targeting a
        # descendant taxon would wrongly match a higher-rank organism.
        assert "562" not in lineage_catalog._lineage_by_tax_id.get("2", set())
        # A workflow for E. coli (562) does not apply to a Bacteria (2) target...
        assert lineage_catalog._workflow_taxon_matches(562, "2") is False
        # ...but a Bacteria (2) workflow still applies to E. coli (562).
        assert lineage_catalog._workflow_taxon_matches(2, "562") is True
