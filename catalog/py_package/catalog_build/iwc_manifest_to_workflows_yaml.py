import argparse
import json
import os
import subprocess
from typing import Dict

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
}
MANIFEST_SOURCE_OF_TRUTH = (
    "trs_id",
    "workflow_name",
    "categories",
    "workflow_description",
    "iwc_id",
)


def read_existing_yaml(workflows_path):
    if os.path.exists(workflows_path):
        with open(workflows_path) as fh:
            workflows = Workflows.model_validate(yaml.safe_load(fh)).workflows
    else:
        # start from scratch
        workflows = []
    by_trs_id = {w.trs_id.rsplit("/versions/v", 1)[0]: w for w in workflows}
    return by_trs_id


def get_workflow_categories_from_collections(collections):
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


def get_input_types(workflow_definition):
    # get all input types
    INPUT_TYPES = ["data_input", "data_collection_input", "parameter_input"]
    inputs: list[WorkflowParameter] = []
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


def generate_current_workflows():
    manifest_data = requests.get(URL).json()
    by_trs_id: Dict[str, Workflow] = {}
    for repo in manifest_data:
        for workflow in repo["workflows"]:
            if "tests" not in workflow:
                # probably fixed on main branch of iwc ?
                # this branch is pretty out of date
                continue
            workflow_input = Workflow(
                active=False,
                trs_id=f"{workflow['trsID']}/versions/v{workflow['definition']['release']}",
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


def merge_into_existing(workflows_path):
    existing = read_existing_yaml(workflows_path)
    current = generate_current_workflows()
    merged: Dict[str, Workflow] = {}
    for versionless_trs_id, current_workflow_input in current.items():
        existing_workflow_input = existing.get(versionless_trs_id)
        if existing_workflow_input:
            # we'll keep whatever has been specified in the brc repo,
            # and only update values that are in the iwc manifest
            exisiting_dict = existing_workflow_input.model_dump()
            new_dict = current_workflow_input.model_dump()
            for key in MANIFEST_SOURCE_OF_TRUTH:
                exisiting_dict[key] = new_dict[key]
            ensure_parameters_exist(current_workflow_input, existing_workflow_input)
            updated_existing_workflow = Workflow(**exisiting_dict)
            add_missing_parameters(current_workflow_input, updated_existing_workflow)
            current_workflow_input = updated_existing_workflow
        merged[versionless_trs_id] = current_workflow_input
    return merged


def to_workflows_yaml(workflows_path: str, exclude_other: bool):
    by_trs_id = merge_into_existing(workflows_path)
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
    args = parser.parse_args()
    to_workflows_yaml(args.workflows_path, exclude_other=args.exclude_other)
