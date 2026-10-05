"""Scope filtering for the MCP-server CatalogData (#1321).

The MCP server uses app.services.catalog_data.CatalogData, which is a separate
implementation from the assistant's app.services.tools.catalog_data.CatalogData
(covered in test_catalog_data.py). Both must hide non-ASSEMBLY-scope workflows
the guided single-organism/single-assembly flow can't drive.
"""

import pytest

from app.services.catalog_data import CatalogData
from tests.test_catalog_data import SAMPLE_WORKFLOWS


@pytest.fixture
def mcp_catalog(catalog_dir):
    return CatalogData(catalog_dir(SAMPLE_WORKFLOWS))


class TestMcpScopeFiltering:
    """The ORGANISM-scope `assembly-with-flye` fixture must not surface via MCP."""

    def test_organism_scope_absent_from_category_listing(self, mcp_catalog):
        wfs = mcp_catalog.get_workflows_in_category("VARIANT_CALLING")
        iwc_ids = {w["iwcId"] for w in wfs}
        assert "assembly-with-flye" not in iwc_ids
        assert len(wfs) == 2

    def test_organism_scope_absent_from_compatible(self, mcp_catalog):
        # ANY ploidy + no taxonomy restriction would match if scope were ignored.
        wfs = mcp_catalog.get_compatible_workflows(["HAPLOID"])
        assert "assembly-with-flye" not in {w["iwcId"] for w in wfs}

    def test_organism_scope_details_returns_none(self, mcp_catalog):
        assert mcp_catalog.get_workflow_details("assembly-with-flye") is None

    def test_organism_scope_not_counted_in_categories(self, mcp_catalog):
        by_cat = {c["category"]: c for c in mcp_catalog.get_workflow_categories()}
        # VARIANT_CALLING holds 3 raw workflows but one is ORGANISM-scope.
        assert by_cat["VARIANT_CALLING"]["workflowCount"] == 2

    def test_organism_scope_inputs_not_resolved(self, mcp_catalog):
        # resolve_workflow_inputs must fail closed -- otherwise it leaks the
        # hidden workflow's name/TRS id/params to any caller that knows the
        # IWC id (#1321). Scope check fires before the assembly lookup.
        with pytest.raises(ValueError):
            mcp_catalog.resolve_workflow_inputs("assembly-with-flye", "GCF_000000000.0")


class TestMcpWorkflowCategory:
    """Condensed workflows carry their category. Only get_workflow_details used
    to fill it in; the category listing and compatibility search returned ""."""

    def test_workflows_in_category_have_category(self, mcp_catalog):
        wfs = mcp_catalog.get_workflows_in_category("VARIANT_CALLING")
        assert wfs
        assert {w["category"] for w in wfs} == {"Variant Calling"}

    def test_compatible_workflows_have_category(self, mcp_catalog):
        wfs = mcp_catalog.get_compatible_workflows(["HAPLOID"])
        by_id = {w["iwcId"]: w["category"] for w in wfs}
        assert by_id == {
            "rnaseq-pe": "Transcriptomics",
            "varcall-haploid": "Variant Calling",
        }

    def test_workflow_details_has_category(self, mcp_catalog):
        details = mcp_catalog.get_workflow_details("rnaseq-pe")
        assert details["category"] == "Transcriptomics"
        assert details["categories"] == ["Transcriptomics"]


class TestMcpSharedWorkflow:
    @pytest.fixture
    def shared_catalog(self, catalog_dir, shared_workflows):
        return CatalogData(catalog_dir(shared_workflows))

    def test_listed_under_each_category(self, shared_catalog):
        for key, name in [
            ("TRANSCRIPTOMICS", "Transcriptomics"),
            ("VARIANT_CALLING", "Variant Calling"),
        ]:
            wfs = shared_catalog.get_workflows_in_category(key)
            by_id = {w["iwcId"]: w["category"] for w in wfs}
            assert by_id["varcall-haploid"] == name

    def test_listed_once_in_compatible_with_every_category(self, shared_catalog):
        compatible = shared_catalog.get_compatible_workflows(["HAPLOID"])
        matches = [w for w in compatible if w["iwcId"] == "varcall-haploid"]
        assert len(matches) == 1
        assert matches[0]["category"] == "Transcriptomics"
        assert matches[0]["categories"] == ["Transcriptomics", "Variant Calling"]

    def test_details_carries_every_category(self, shared_catalog):
        details = shared_catalog.get_workflow_details("varcall-haploid")
        assert details["category"] == "Transcriptomics"
        assert details["categories"] == ["Transcriptomics", "Variant Calling"]

    def test_organism_scope_first_copy_is_skipped(
        self, catalog_dir, scope_split_workflows
    ):
        # The index must keep the servable ASSEMBLY copy, not the first copy,
        # or details/compatibility would report the workflow as not found.
        catalog = CatalogData(catalog_dir(scope_split_workflows))
        details = catalog.get_workflow_details("varcall-haploid")
        assert details["category"] == "Variant Calling"
        assert details["categories"] == ["Variant Calling"]
        compat = catalog.check_workflow_assembly_compatibility(
            "varcall-haploid", "GCF_000002765.6"
        )
        # No assemblies fixture here, so the lookup gets past the workflow and
        # stops at the assembly.
        assert compat["reason"].startswith("Assembly")
