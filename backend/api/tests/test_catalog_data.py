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
                "ploidy": "HAPLOID",
                "trsId": "#workflow/github.com/iwc/varcall-haploid/main",
                "taxonomyId": None,
                "parameters": [],
            },
            {
                "iwcId": "varcall-diploid",
                "workflowName": "Variant Calling (Diploid)",
                "workflowDescription": "Diploid variant calling",
                "ploidy": "DIPLOID",
                "trsId": "#workflow/github.com/iwc/varcall-diploid/main",
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
