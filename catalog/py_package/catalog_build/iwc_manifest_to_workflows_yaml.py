import argparse
import json
import os
import re
import subprocess
import time
from typing import Dict, List

import requests
import yaml

from .generated_schema.schema import (
    Workflow,
    WorkflowCategoryId,
    WorkflowParameter,
    WorkflowPloidy,
    Workflows,
)

URL = "https://iwc.galaxyproject.org/workflow_manifest.json"
DOCKSTORE_COLLECTION_TO_CATEGORY = {
    "Variant Calling": WorkflowCategoryId.VARIANT_CALLING,
    "Transcriptomics": WorkflowCategoryId.TRANSCRIPTOMICS,
    "Epigenetics": WorkflowCategoryId.REGULATION,
    "Genome assembly": WorkflowCategoryId.ASSEMBLY,
    "Virology": WorkflowCategoryId.CONSENSUS_SEQUENCES,
    "Genome Annotation": WorkflowCategoryId.ANNOTATION,
}
MANIFEST_SOURCE_OF_TRUTH = (
    "trs_id",
    "workflow_name",
    "categories",
    "workflow_description",
    "iwc_id",
)


def read_existing_yaml(workflows_path: str) -> Dict[str, Workflow]:
    if os.path.exists(workflows_path):
        with open(workflows_path) as fh:
            workflows = Workflows.model_validate(yaml.safe_load(fh)).workflows
    else:
        # start from scratch
        workflows = []
    by_trs_id = {w.trs_id.rsplit("/versions/v", 1)[0]: w for w in workflows}
    return by_trs_id


def get_workflow_categories_from_collections(
    collections: List[str],
) -> List[WorkflowCategoryId]:
    return sorted(
        list(
            set(
                [
                    DOCKSTORE_COLLECTION_TO_CATEGORY.get(c, WorkflowCategoryId.OTHER)
                    for c in collections
                ]
            )
        )
    )


def get_input_types(workflow_definition: dict) -> List[WorkflowParameter]:
    # get all input types
    INPUT_TYPES = ["data_input", "data_collection_input", "parameter_input"]
    inputs: List[WorkflowParameter] = []
    for step in workflow_definition["steps"].values():
        step_label = step["label"]
        step_type = step["type"]
        if step_type not in INPUT_TYPES:
            continue
        tool_state = step["tool_state"]
        if isinstance(tool_state, str):
            tool_state = json.loads(tool_state)
        if step_type in ("data_input", "data_collection_input"):
            step_input_guide = {
                "class": "File" if step_type == "data_input" else "Collection"
            }
            input_formats = tool_state.get("format")
            if input_formats:
                if len(input_formats) == 1:
                    step_input_guide["ext"] = input_formats[0]
                else:
                    step_input_guide["ext"] = input_formats
            if collection_type := tool_state.get("collection_type"):
                step_input_guide["collection_type"] = collection_type
            inputs.append(
                WorkflowParameter(key=step_label, type_guide=step_input_guide)
            )
        if step_type == "parameter_input":
            inputs.append(
                WorkflowParameter(
                    key=step_label,
                    type_guide={"class": tool_state.get("parameter_type")},
                )
            )
    return inputs


def verify_trs_version_exists(trs_id: str, skip_validation: bool = False) -> bool:
    """Check if a workflow version exists on Dockstore via TRS API."""
    if skip_validation:
        return True

    # Parse the TRS ID to extract components
    match = re.match(
        r"#workflow/github\.com/iwc-workflows/([^/]+)/([^/]+)/versions/v(.+)", trs_id
    )
    if not match:
        print(f"Warning: Cannot parse TRS ID for validation: {trs_id}")
        return True  # We can't look this up, but someone put it in -- don't fail

    repo, workflow_name, version = match.groups()

    # The workflow ID format for Dockstore is the full TRS ID without the version part
    workflow_id = f"#workflow/github.com/iwc-workflows/{repo}/{workflow_name}"
    # URL encode the workflow ID and version
    encoded_id = requests.utils.quote(workflow_id, safe="")
    encoded_version = requests.utils.quote(f"v{version}", safe="")

    dockstore_url = f"https://dockstore.org/api/ga4gh/trs/v2/tools/{encoded_id}/versions/{encoded_version}"

    try:
        response = requests.get(dockstore_url, timeout=10)
        if response.status_code == 200:
            return True
        elif response.status_code == 404:
            return False
        else:
            print(
                f"Warning: Unexpected status {response.status_code} checking {trs_id} at Dockstore"
            )
            return True  # Don't drop workflows on weirdness
    except requests.RequestException as e:
        print(f"Warning: Error checking version {trs_id}: {e}")
        return True
    finally:
        # Don't slam dockstore
        time.sleep(0.1)


def generate_current_workflows(skip_validation: bool = False) -> Dict[str, Workflow]:
    manifest_data = requests.get(URL).json()
    by_trs_id: Dict[str, Workflow] = {}
    version_warnings = []

    for repo in manifest_data:
        for workflow in repo["workflows"]:
            if "tests" not in workflow:
                # probably fixed on main branch of iwc ?
                # this branch is pretty out of date
                continue

            trs_id = (
                f"{workflow['trsID']}/versions/v{workflow['definition']['release']}"
            )

            if not verify_trs_version_exists(trs_id, skip_validation):
                # This is just informational - we'll keep the workflow with whatever
                # version is already in workflows.yml (handled in merge_into_existing)
                version_warnings.append(
                    f"Info: IWC manifest has v{workflow['definition']['release']} for {workflow['trsID']} but it's not on Dockstore yet"
                )

            workflow_input = Workflow(
                active=False,
                trs_id=trs_id,
                workflow_name=workflow["definition"]["name"],
                categories=get_workflow_categories_from_collections(
                    workflow["collections"]
                ),
                workflow_description=workflow["definition"]["annotation"],
                ploidy=WorkflowPloidy.ANY,
                iwc_id=workflow.get("iwcID"),
                # readme=workflow["readme"],
                # shortcut so we don't need to parse out the whole inputs section
                parameters=get_input_types(workflow["definition"]),
            )
            by_trs_id[workflow["trsID"]] = workflow_input

    if version_warnings and not skip_validation:
        print("\nVersion status notes:")
        for warning in version_warnings:
            print(f"  {warning}")

    return by_trs_id


def ensure_parameters_exist(
    current_workflow_input: Workflow, existing_workflow_input: Workflow
):
    # check that specified parameters still exist
    current_workflow_parameter_keys = {
        param.key for param in current_workflow_input.parameters
    }
    for param in existing_workflow_input.parameters:
        if param.key not in current_workflow_parameter_keys:
            # Should be rare, but can happen.
            raise Exception(
                f"{param.key} specified but is not part of updated workflow {current_workflow_input.trs_id}! Review and fix manually"
            )


def add_missing_parameters(
    current_workflow_input: Workflow, existing_workflow_input: Workflow
):
    # check for missing parameters in the existing workflow
    existing_parameter_keys = {
        param.key for param in existing_workflow_input.parameters
    }
    for param in current_workflow_input.parameters:
        if param.key not in existing_parameter_keys:
            # If a parameter is missing in the existing workflow, add it
            existing_workflow_input.parameters.append(param)


def merge_into_existing(
    workflows_path: str, skip_validation: bool = False
) -> Dict[str, Workflow]:
    existing = read_existing_yaml(workflows_path)
    current = generate_current_workflows(skip_validation)
    merged: Dict[str, Workflow] = {}
    invalid_versions = []
    versions_kept = []

    for versionless_trs_id, current_workflow_input in current.items():
        existing_workflow_input = existing.get(versionless_trs_id)
        if not existing_workflow_input:
            merged[versionless_trs_id] = current_workflow_input
            continue

        iwc_version_valid = verify_trs_version_exists(
            current_workflow_input.trs_id, skip_validation
        )
        existing_version_valid = verify_trs_version_exists(
            existing_workflow_input.trs_id, skip_validation
        )

        # Decide which version to use
        if not iwc_version_valid and existing_version_valid:
            # IWC version not on Dockstore yet, but existing version is valid
            versions_kept.append(
                f"Keeping {existing_workflow_input.trs_id} (IWC has newer unreleased version)"
            )
            current_workflow_input.trs_id = existing_workflow_input.trs_id
        elif not existing_version_valid:
            # Existing version is invalid (manually edited to bad version)
            if iwc_version_valid:
                print(
                    f"Error: Invalid version {existing_workflow_input.trs_id} doesn't exist on Dockstore"
                )
                print(f"  -> Reverting to IWC version: {current_workflow_input.trs_id}")
                invalid_versions.append(existing_workflow_input.trs_id)
            else:
                # Both versions are invalid - this shouldn't happen often
                print(
                    f"Error: Neither existing nor IWC version exists on Dockstore for {versionless_trs_id}"
                )
                # Keep what we have
                current_workflow_input.trs_id = existing_workflow_input.trs_id

        # Build the merged workflow
        existing_dict = existing_workflow_input.model_dump()
        new_dict = current_workflow_input.model_dump()

        # Update manifest-controlled fields
        for key in MANIFEST_SOURCE_OF_TRUTH:
            existing_dict[key] = new_dict[key]

        ensure_parameters_exist(current_workflow_input, existing_workflow_input)
        updated_existing_workflow = Workflow(**existing_dict)
        add_missing_parameters(current_workflow_input, updated_existing_workflow)
        current_workflow_input = updated_existing_workflow
        merged[versionless_trs_id] = current_workflow_input

    if versions_kept and not skip_validation:
        print(
            f"\nKept {len(versions_kept)} existing versions (newer IWC versions not on Dockstore yet)"
        )
        for msg in versions_kept:
            print(f"  {msg}")

    if invalid_versions:
        print(f"\nFixed {len(invalid_versions)} invalid versions in workflows.yml")

    return merged


def to_workflows_yaml(
    workflows_path: str, exclude_other: bool, skip_validation: bool = False
):
    by_trs_id = merge_into_existing(workflows_path, skip_validation)
    # sort by trs id, should play nicer with git diffs
    sorted_workflows = list(dict(sorted(by_trs_id.items())).values())
    if exclude_other:
        print("excluding!")
        final_workflows = []
        for workflow in sorted_workflows:
            if WorkflowCategoryId.OTHER in workflow.categories:
                workflow.categories.remove(WorkflowCategoryId.OTHER)
                if not workflow.categories:
                    print(f"Excluding workflow {workflow.trs_id}, category unknown")
                    continue
            final_workflows.append(workflow)
        sorted_workflows = final_workflows
    final_workflows = sorted_workflows
    with open(workflows_path, "w") as out:
        yaml.safe_dump(
            Workflows(workflows=final_workflows).model_dump(exclude_none=True),
            out,
            allow_unicode=True,
            sort_keys=False,
        )
    # Turns out the YAML style prettier likes is really hard to create in python ...
    subprocess.run(["npx", "prettier", "--write", workflows_path])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Build workflows.yaml file from latest IWC JSON manifest."
    )
    parser.add_argument(
        "workflows_path", help="Path of workflows YAML file to read/write."
    )
    parser.add_argument(
        "--exclude-other",
        action="store_true",
        help="Exclude other items from processing.",
    )
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip validation of workflow versions against TRS API.",
    )
    args = parser.parse_args()
    to_workflows_yaml(
        args.workflows_path,
        exclude_other=args.exclude_other,
        skip_validation=args.skip_validation,
    )
