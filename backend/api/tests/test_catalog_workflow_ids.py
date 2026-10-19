"""Workflow lookups accept a TRS id as well as an IWC id.

Tool outputs show the model each workflow's TRS id, so it passes those back
to the workflow tools -- often without the `/versions/...` suffix the catalog
stores (Sentry BRC-ANALYTICS-DEV-4J). Both CatalogData implementations (the MCP
server's and the assistant's) must resolve either form, and must still hide
non-ASSEMBLY-scope workflows whichever id is used (#1321).
"""

import copy
import json

import pytest

from app.services.catalog_data import CatalogData as McpCatalogData
from app.services.tools.catalog_data import CatalogData as AssistantCatalogData
from tests.test_catalog_data import SAMPLE_WORKFLOWS

# Versioned like the real catalog's trsId values.
RNASEQ_TRS = "#workflow/github.com/iwc/rnaseq-pe/main/versions/v1.4"
RNASEQ_TRS_BASE = "#workflow/github.com/iwc/rnaseq-pe/main"
FLYE_TRS = "#workflow/github.com/iwc/assembly-with-flye/main/versions/v0.4"

# MCP CatalogData reads assemblies from assemblies.json rather than from
# organisms' genomes.
SAMPLE_ASSEMBLIES = [
    {
        "accession": "GCF_000002765.6",
        "ncbiTaxonomyId": 5833,
        "speciesTaxonomyId": 5833,
        "ploidy": ["HAPLOID"],
        "lineageTaxonomyIds": [1, 2759, 5833],
        "geneModelUrl": "https://example.com/pf.gtf",
    },
]


@pytest.fixture
def versioned_workflows():
    workflows = copy.deepcopy(SAMPLE_WORKFLOWS)
    for cat in workflows:
        for wf in cat["workflows"]:
            wf["trsId"] = {
                "rnaseq-pe": RNASEQ_TRS,
                "assembly-with-flye": FLYE_TRS,
            }.get(wf["iwcId"], wf["trsId"])
    return workflows


@pytest.fixture(params=[McpCatalogData, AssistantCatalogData], ids=["mcp", "assistant"])
def catalog(request, catalog_dir, versioned_workflows, tmp_path):
    path = catalog_dir(versioned_workflows)
    (tmp_path / "assemblies.json").write_text(json.dumps(SAMPLE_ASSEMBLIES))
    return request.param(path)


def _iwc_id(details):
    # The MCP catalog condenses to camelCase, the assistant's to snake_case.
    return details.get("iwcId") or details.get("iwc_id")


class TestWorkflowDetailsById:
    @pytest.mark.parametrize(
        "workflow_id",
        [
            "rnaseq-pe",
            RNASEQ_TRS,
            RNASEQ_TRS_BASE,
            # A version the catalog doesn't carry still names the workflow;
            # the details report the catalog's version.
            "#workflow/github.com/iwc/rnaseq-pe/main/versions/v1.3",
            "workflow/github.com/iwc/rnaseq-pe/main",
            "  #Workflow/GitHub.com/IWC/RNAseq-PE/main  ",
        ],
    )
    def test_resolves(self, catalog, workflow_id):
        details = catalog.get_workflow_details(workflow_id)
        assert details is not None
        assert _iwc_id(details) == "rnaseq-pe"

    @pytest.mark.parametrize(
        "workflow_id",
        [
            "#workflow/github.com/iwc/no-such-workflow/main",
            "#workflow/github.com/iwc/rnaseq-pe",
            "#workflow/github.com/iwc/rnaseq-pe/main/extra",
            "",
        ],
    )
    def test_unknown_id_is_none(self, catalog, workflow_id):
        assert catalog.get_workflow_details(workflow_id) is None

    @pytest.mark.parametrize(
        "workflow_id", [FLYE_TRS, "#workflow/github.com/iwc/assembly-with-flye/main"]
    )
    def test_organism_scope_hidden_by_trs_id(self, catalog, workflow_id):
        assert catalog.get_workflow_details(workflow_id) is None


class TestCompatibilityById:
    def test_trs_id(self, catalog):
        result = catalog.check_workflow_assembly_compatibility(
            RNASEQ_TRS_BASE, "GCF_000002765.6"
        )
        assert result["compatible"] is True

    def test_organism_scope_trs_id_not_found(self, catalog):
        result = catalog.check_workflow_assembly_compatibility(
            FLYE_TRS, "GCF_000002765.6"
        )
        assert result["compatible"] is False
        assert "not found" in result["reason"]


class TestMcpResolveInputsById:
    @pytest.fixture
    def mcp_catalog(self, catalog_dir, versioned_workflows, tmp_path):
        path = catalog_dir(versioned_workflows)
        (tmp_path / "assemblies.json").write_text(json.dumps(SAMPLE_ASSEMBLIES))
        return McpCatalogData(path)

    @pytest.mark.parametrize("workflow_id", ["rnaseq-pe", RNASEQ_TRS, RNASEQ_TRS_BASE])
    def test_resolves(self, mcp_catalog, workflow_id):
        result = mcp_catalog.resolve_workflow_inputs(workflow_id, "GCF_000002765.6")
        assert result["workflow_name"] == "RNA-Seq Paired End"
        assert result["trs_id"] == RNASEQ_TRS
        assert result["resolved"] == {"gene_model": "https://example.com/pf.gtf"}
        assert result["compatible"] is True

    @pytest.mark.parametrize(
        "workflow_id", [FLYE_TRS, "#workflow/github.com/iwc/assembly-with-flye/main"]
    )
    def test_organism_scope_fails_closed(self, mcp_catalog, workflow_id):
        with pytest.raises(ValueError, match="not found"):
            mcp_catalog.resolve_workflow_inputs(workflow_id, "GCF_000002765.6")
