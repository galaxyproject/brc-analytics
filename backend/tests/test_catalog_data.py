"""Unit tests for CatalogData class.

Tests run against the real catalog JSON in catalog/output/, so no mocking
needed — CatalogData is pure in-memory lookups.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.catalog_data import CatalogData

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "catalog", "output")


@pytest.fixture(scope="module")
def catalog():
    return CatalogData(CATALOG_PATH)


class TestCatalogDataLoading:
    def test_loads_organisms(self, catalog):
        assert len(catalog.organisms) > 1900

    def test_loads_assemblies(self, catalog):
        assert len(catalog.assemblies) > 5000

    def test_loads_workflow_categories(self, catalog):
        assert len(catalog.workflow_categories) == 8

    def test_builds_organism_index(self, catalog):
        assert len(catalog._organisms_by_tax_id) > 0

    def test_builds_assembly_index(self, catalog):
        assert len(catalog._assemblies_by_accession) > 0

    def test_builds_workflow_index(self, catalog):
        assert len(catalog._workflows_by_iwc_id) > 0


class TestSearchOrganisms:
    def test_search_by_genus(self, catalog):
        results = catalog.search_organisms("Plasmodium")
        assert len(results) > 0
        assert all(r["genus"] == "Plasmodium" for r in results)

    def test_search_by_common_name(self, catalog):
        results = catalog.search_organisms("malaria")
        assert len(results) > 0
        names = [r.get("commonName") or "" for r in results]
        assert any("malaria" in n.lower() for n in names)

    def test_search_by_taxonomy_id(self, catalog):
        results = catalog.search_organisms("5833")
        assert len(results) > 0
        assert any(r["ncbiTaxonomyId"] == "5833" for r in results)

    def test_search_respects_limit(self, catalog):
        results = catalog.search_organisms("Plasmodium", limit=2)
        assert len(results) <= 2

    def test_search_no_results(self, catalog):
        results = catalog.search_organisms("zzzznonexistent")
        assert results == []


class TestGetOrganism:
    def test_get_existing_organism(self, catalog):
        org = catalog.get_organism_by_taxonomy_id("5833")
        assert org is not None
        assert org["ncbiTaxonomyId"] == "5833"
        assert org["species"] == "Plasmodium falciparum"
        assert org["genus"] == "Plasmodium"

    def test_get_nonexistent_organism(self, catalog):
        assert catalog.get_organism_by_taxonomy_id("0000000") is None


class TestAssemblies:
    def test_get_assemblies_for_organism(self, catalog):
        assemblies = catalog.get_assemblies_for_organism("5833")
        assert len(assemblies) > 0
        assert all("accession" in a for a in assemblies)
        assert all("ploidy" in a for a in assemblies)

    def test_get_assemblies_empty(self, catalog):
        assert catalog.get_assemblies_for_organism("0000000") == []

    def test_get_assembly_details(self, catalog):
        asm = catalog.get_assembly_details("GCF_000005845.2")
        assert asm is not None
        assert asm["accession"] == "GCF_000005845.2"
        assert asm["level"] == "Complete Genome"
        assert "geneModelUrl" in asm

    def test_get_assembly_details_not_found(self, catalog):
        assert catalog.get_assembly_details("GCF_FAKE_000.0") is None


class TestWorkflows:
    def test_get_workflow_categories(self, catalog):
        cats = catalog.get_workflow_categories()
        assert len(cats) == 8
        assert all(
            "category" in c and "name" in c and "workflowCount" in c for c in cats
        )

    def test_get_workflows_in_category_by_key(self, catalog):
        wfs = catalog.get_workflows_in_category("VARIANT_CALLING")
        assert len(wfs) > 0
        assert all("iwcId" in w for w in wfs)

    def test_get_workflows_in_category_by_name(self, catalog):
        wfs = catalog.get_workflows_in_category("Variant calling")
        assert len(wfs) > 0

    def test_get_workflows_in_category_not_found(self, catalog):
        assert catalog.get_workflows_in_category("NONEXISTENT") == []

    def test_get_workflow_details(self, catalog):
        wf = catalog.get_workflow_details("amr_gene_detection-main")
        assert wf is not None
        assert wf["iwcId"] == "amr_gene_detection-main"
        assert wf["name"] == "AMR Gene Detection"
        assert wf["parameters"] is not None
        assert wf["trsId"] is not None

    def test_get_workflow_details_not_found(self, catalog):
        assert catalog.get_workflow_details("fake-workflow-id") is None


class TestCompatibility:
    def test_compatible_workflow_assembly(self, catalog):
        # AMR Gene Detection (HAPLOID) + E. coli assembly (HAPLOID)
        result = catalog.check_workflow_assembly_compatibility(
            "amr_gene_detection-main", "GCF_000005845.2"
        )
        assert result["compatible"] is True

    def test_ploidy_mismatch(self, catalog):
        # Haploid-only workflow + diploid assembly
        result = catalog.check_workflow_assembly_compatibility(
            "haploid-variant-calling-wgs-pe-main", "GCA_000002985.3"
        )
        assert result["compatible"] is False
        assert "Ploidy mismatch" in result["reason"]

    def test_any_ploidy_matches_all(self, catalog):
        # atacseq (ANY ploidy) should be compatible with any assembly
        result = catalog.check_workflow_assembly_compatibility(
            "atacseq-main", "GCA_000002985.3"
        )
        assert result["compatible"] is True

    def test_workflow_not_found(self, catalog):
        result = catalog.check_workflow_assembly_compatibility(
            "nonexistent-wf", "GCF_000005845.2"
        )
        assert result["compatible"] is False
        assert "not found" in result["reason"]

    def test_assembly_not_found(self, catalog):
        result = catalog.check_workflow_assembly_compatibility(
            "amr_gene_detection-main", "GCF_FAKE_000.0"
        )
        assert result["compatible"] is False
        assert "not found" in result["reason"]


class TestGetCompatibleWorkflows:
    def test_haploid_includes_any(self, catalog):
        results = catalog.get_compatible_workflows(["HAPLOID"])
        assert len(results) > 0
        ploidies = {r["ploidy"] for r in results}
        assert "HAPLOID" in ploidies or "ANY" in ploidies or None in ploidies

    def test_with_taxonomy_filter(self, catalog):
        # taxonomy 2 = Bacteria; AMR workflow targets taxonomy 2
        results = catalog.get_compatible_workflows(["HAPLOID"], taxonomy_id="2")
        assert len(results) > 0
        # AMR workflow (targets Bacteria=2) should be in results
        amr = [r for r in results if r["iwcId"] == "amr_gene_detection-main"]
        assert len(amr) == 1

    def test_lineage_based_taxonomy_matching(self, catalog):
        # E. coli species tax ID is 562; AMR workflow targets Bacteria (2).
        # 2 is in E. coli's lineage, so the AMR workflow should be returned.
        results = catalog.get_compatible_workflows(["HAPLOID"], taxonomy_id="562")
        amr = [r for r in results if r["iwcId"] == "amr_gene_detection-main"]
        assert len(amr) == 1


class TestResolveWorkflowInputs:
    def test_resolves_fasta_url(self, catalog):
        # AMR workflow has ASSEMBLY_FASTA_URL param
        result = catalog.resolve_workflow_inputs(
            "amr_gene_detection-main", "GCF_000005845.2"
        )
        assert "Input sequence fasta" in result["resolved"]
        url = result["resolved"]["Input sequence fasta"]
        assert "hgdownload.soe.ucsc.edu" in url
        assert "GCF_000005845.2" in url

    def test_resolves_gene_model(self, catalog):
        # Haploid VC has GENE_MODEL_URL; E. coli assembly has a geneModelUrl
        result = catalog.resolve_workflow_inputs(
            "haploid-variant-calling-wgs-pe-main", "GCF_000005845.2"
        )
        assert "Annotation GTF" in result["resolved"]
        assert "gtf" in result["resolved"]["Annotation GTF"].lower()

    def test_unresolved_gene_model(self, catalog):
        # GCF_002986165.1 has geneModelUrl=None
        result = catalog.resolve_workflow_inputs(
            "haploid-variant-calling-wgs-pe-main", "GCF_002986165.1"
        )
        unresolved_keys = [u["key"] for u in result["unresolved"]]
        assert "Annotation GTF" in unresolved_keys

    def test_unresolved_sequencing_data(self, catalog):
        # atacseq has SANGER_READ_RUN_PAIRED with data_requirements
        result = catalog.resolve_workflow_inputs("atacseq-main", "GCF_000005845.2")
        sanger = [
            u for u in result["unresolved"] if u["variable"] == "SANGER_READ_RUN_PAIRED"
        ]
        assert len(sanger) == 1
        assert "data_requirements" in sanger[0]

    def test_resolves_url_spec(self, catalog):
        # ARTIC workflow has url_spec parameters (primer BED files)
        artic_id = (
            "sars-cov-2-pe-illumina-artic-variant-calling-covid-19-pe-artic-illumina"
        )
        # Need an assembly that won't cause taxonomy mismatch — use any since we just
        # want to verify url_spec resolution works
        result = catalog.resolve_workflow_inputs(artic_id, "GCF_000005845.2")
        assert "ARTIC primer BED" in result["resolved"]
        assert "zenodo.org" in result["resolved"]["ARTIC primer BED"]

    def test_includes_compatibility(self, catalog):
        result = catalog.resolve_workflow_inputs(
            "amr_gene_detection-main", "GCF_000005845.2"
        )
        assert "compatible" in result
        assert "compatibility_issues" in result
        assert isinstance(result["compatible"], bool)

    def test_workflow_not_found_raises(self, catalog):
        with pytest.raises(ValueError, match="not found"):
            catalog.resolve_workflow_inputs("fake-wf", "GCF_000005845.2")

    def test_assembly_not_found_raises(self, catalog):
        with pytest.raises(ValueError, match="not found"):
            catalog.resolve_workflow_inputs("amr_gene_detection-main", "GCF_FAKE.0")


class TestBuildFastaUrl:
    def test_valid_accession(self, catalog):
        url = catalog._build_fasta_url("GCF_000005845.2")
        assert url == (
            "https://hgdownload.soe.ucsc.edu/hubs/"
            "GCF/000/005/845/GCF_000005845.2/GCF_000005845.2.fa.gz"
        )

    def test_invalid_accession_format(self, catalog):
        with pytest.raises(ValueError, match="Invalid accession"):
            catalog._build_fasta_url("bad-accession")
