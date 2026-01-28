import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class WorkflowCatalog:
    """
    Loads and provides condensed workflow catalog information for LLM context.

    This creates a simplified view of the workflow catalog that contains only
    the essential information needed for LLM-based recommendations.
    """

    def __init__(self, catalog_path: str):
        """
        Initialize workflow catalog loader

        Args:
            catalog_path: Path to the catalog output directory containing workflows.json
        """
        self.catalog_path = Path(catalog_path)
        self.workflows: List[Dict] = []
        self._load_workflows()

    def _load_workflows(self) -> None:
        """Load and condense workflow catalog from JSON file"""
        workflows_file = self.catalog_path / "workflows.json"

        if not workflows_file.exists():
            logger.warning(f"Workflow catalog not found at {workflows_file}")
            return

        try:
            with open(workflows_file) as f:
                categories = json.load(f)

            # Condense to essential information only
            for category in categories:
                category_name = category.get("name", "")
                category_key = category.get("category", "")

                for wf in category.get("workflows", []):
                    # Extract key input types from parameters
                    input_types = self._extract_input_types(wf.get("parameters", []))

                    condensed = {
                        "id": wf.get("iwcId", ""),
                        "name": wf.get("workflowName", ""),
                        "description": wf.get("workflowDescription", "")[
                            :200
                        ],  # Truncate
                        "category": category_name,
                        "category_key": category_key,
                        "ploidy": wf.get("ploidy"),
                        "taxonomy_id": wf.get("taxonomyId"),
                        "input_types": input_types,
                    }
                    self.workflows.append(condensed)

            logger.info(f"Loaded {len(self.workflows)} workflows from catalog")

        except Exception as e:
            logger.error(f"Failed to load workflow catalog: {e}")

    def _extract_input_types(self, parameters: List[Dict]) -> List[str]:
        """
        Extract input data types from workflow parameters

        Args:
            parameters: List of parameter definitions

        Returns:
            List of input type descriptions
        """
        input_types = []
        for param in parameters:
            key = param.get("key", "").lower()
            if "paired" in key:
                input_types.append("paired-end reads")
            elif "single" in key:
                input_types.append("single-end reads")
            elif "fasta" in key or "genome" in key:
                input_types.append("reference genome")
            elif "annotation" in key or "gtf" in key or "gff" in key:
                input_types.append("gene annotation")

        return list(set(input_types))  # Remove duplicates

    def get_context_summary(self) -> str:
        """
        Get condensed workflow catalog as JSON string for LLM context

        Returns:
            JSON string with condensed workflow information
        """
        return json.dumps(self.workflows, indent=2)

    def get_workflows_by_category(self, category_key: str) -> List[Dict]:
        """
        Get workflows filtered by category

        Args:
            category_key: Category key (e.g., 'VARIANT_CALLING')

        Returns:
            List of workflows in that category
        """
        return [wf for wf in self.workflows if wf["category_key"] == category_key]

    def get_workflow_by_id(self, workflow_id: str) -> Optional[Dict]:
        """
        Get workflow by ID

        Args:
            workflow_id: Workflow iwcId

        Returns:
            Workflow dict or None if not found
        """
        for wf in self.workflows:
            if wf["id"] == workflow_id:
                return wf
        return None

    def get_workflows_for_organism(self, taxonomy_id: str) -> List[Dict]:
        """
        Get workflows that match a specific organism

        Args:
            taxonomy_id: NCBI taxonomy ID

        Returns:
            List of matching workflows (or all if no taxonomy constraint)
        """
        matching = []
        for wf in self.workflows:
            # If workflow has no taxonomy constraint, it's universal
            if wf["taxonomy_id"] is None:
                matching.append(wf)
            # If taxonomy matches, include it
            elif wf["taxonomy_id"] == taxonomy_id:
                matching.append(wf)

        return matching

    def count(self) -> int:
        """Get total number of workflows"""
        return len(self.workflows)
