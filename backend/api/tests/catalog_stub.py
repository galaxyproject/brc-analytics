"""A mock assistant catalog whose workflow lookups are a real CatalogData's."""

import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

from app.services.tools.catalog_data import CatalogData


def stub_catalog() -> MagicMock:
    """A mock catalog whose workflow lookups are the real CatalogData ones.

    Setting `workflows_by_category` loads a CatalogData from those workflows,
    so `find_workflow` and `visible_workflows` match ids and apply the
    visibility rule exactly as production does. Everything else stays a mock.
    """
    catalog = MagicMock()
    loaded = {}

    def set_workflows(_catalog: MagicMock, categories: list) -> None:
        with tempfile.TemporaryDirectory() as path:
            (Path(path) / "workflows.json").write_text(json.dumps(categories))
            loaded["index"] = CatalogData(path)

    # Each MagicMock has its own class, so the property is this mock's alone.
    type(catalog).workflows_by_category = property(
        lambda _catalog: loaded["index"].workflows_by_category, set_workflows
    )
    catalog.find_workflow = lambda workflow_id: loaded["index"].find_workflow(
        workflow_id
    )
    catalog.visible_workflows = lambda: loaded["index"].visible_workflows()
    catalog.workflows_by_category = []
    catalog.organisms = []
    return catalog
