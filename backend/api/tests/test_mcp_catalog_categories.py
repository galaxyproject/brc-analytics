"""Condensed workflows from the MCP-server CatalogData carry their category.

Only get_workflow_details used to fill in "category"; the category listing and
compatibility search condensed the raw workflow dicts and returned "".
"""

import copy
import json

import pytest

from app.services.catalog_data import CatalogData
from tests.test_catalog_data import SAMPLE_ORGANISMS, SAMPLE_WORKFLOWS


def _write_catalog(tmp_path, workflows):
    (tmp_path / "organisms.json").write_text(json.dumps(SAMPLE_ORGANISMS))
    (tmp_path / "workflows.json").write_text(json.dumps(workflows))
    return CatalogData(str(tmp_path))


@pytest.fixture
def mcp_catalog(tmp_path):
    return _write_catalog(tmp_path, SAMPLE_WORKFLOWS)


@pytest.fixture
def shared_workflow_catalog(tmp_path):
    # Mirrors generic-non-segmented-viral-variant-calling, which the real
    # catalog lists under two categories.
    workflows = copy.deepcopy(SAMPLE_WORKFLOWS)
    shared = copy.deepcopy(workflows[1]["workflows"][0])
    workflows[0]["workflows"].append(shared)
    return _write_catalog(tmp_path, workflows)


class TestMcpWorkflowCategory:
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

    def test_shared_workflow_listed_under_each_category(self, shared_workflow_catalog):
        transcriptomics = shared_workflow_catalog.get_workflows_in_category(
            "TRANSCRIPTOMICS"
        )
        varcall = shared_workflow_catalog.get_workflows_in_category("VARIANT_CALLING")
        assert {w["iwcId"]: w["category"] for w in transcriptomics}[
            "varcall-haploid"
        ] == "Transcriptomics"
        assert {w["iwcId"]: w["category"] for w in varcall}[
            "varcall-haploid"
        ] == "Variant Calling"

    def test_shared_workflow_listed_once_in_compatible(self, shared_workflow_catalog):
        # The first category the workflow appears under wins, same as details.
        compatible = shared_workflow_catalog.get_compatible_workflows(["HAPLOID"])
        assert [
            w["category"] for w in compatible if w["iwcId"] == "varcall-haploid"
        ] == ["Transcriptomics"]

    def test_shared_workflow_details_takes_first_category(
        self, shared_workflow_catalog
    ):
        details = shared_workflow_catalog.get_workflow_details("varcall-haploid")
        assert details["category"] == "Transcriptomics"
