import argparse
import json
import os
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Literal

import requests
import yaml

# quick and dirty, could build manifest as part of CI
URL = "https://iwc.galaxyproject.org/workflow_manifest.json"
WORKFLOWS_PATH = "workflows.yml"
CATEGORIES = Literal[
    "VARIANT_CALLING",
    "TRANSCRIPTOMICS",
    "REGULATION",
    "ASSEMBLY",
    "GENOME_COMPARISONS",
    "PROTEIN_FOLDING",
    "OTHER",
]
DOCKSTORE_COLLECTION_TO_CATEGORY = {
    "Variant Calling": "VARIANT_CALLING",
    "Transcriptomics": "TRANSCRIPTOMICS",
    "Epigenetics": "REGULATION",
    "Genome assembly": "ASSEMBLY",
}


@dataclass
class WorkflowInput:
    trs_id: str
    workflow_categories: List[str]
    workflow_name: str
    workflow_description: str
    ploidy: str
    # readme: str
    parameters: Dict[str, Any]
    active: bool = False

    def as_dict(self):
        # convert to brc category enum
        d = asdict(self)
        d["workflow_categories"] = sorted(
            list(
                set(
                    DOCKSTORE_COLLECTION_TO_CATEGORY.get(c, "OTHER")
                    for c in self.workflow_categories
                )
            )
        )
        return d


def read_existing_yaml():
    if os.path.exists(WORKFLOWS_PATH):
        with open(WORKFLOWS_PATH) as fh:
            doc = yaml.safe_load(fh)
            workflows = [WorkflowInput(**w) for w in doc["workflows"]]
    else:
        # start from scratch
        workflows = []
    by_trs_id = {w.trs_id.rsplit("/versions/v", 1)[0]: w for w in workflows}
    return by_trs_id


def get_input_types(workflow_definition):
    # get all input types
    INPUT_TYPES = ["data_input", "data_collection_input", "parameter_input"]
    inputs = {}
    for step in workflow_definition["steps"].values():
        step_label = step["label"]
        step_type = step["type"]
        if step_type not in INPUT_TYPES:
            continue
        tool_state = step["tool_state"]
        if isinstance(tool_state, str):
            tool_state = json.loads(tool_state)
        if step_type in ("data_input", "data_collection_input"):
            step_input = {
                "class": "File" if step_type == "data_input" else "Collection"
            }
            input_formats = tool_state.get("format")
            if input_formats:
                if len(input_formats) == 1:
                    step_input["ext"] = input_formats[0]
                else:
                    step_input["ext"] = input_formats
            inputs[step_label] = step_input
        if step_type == "parameter_input":
            inputs[step_label] = {"class": tool_state.get("parameter_type")}
    return inputs


def generate_current_workflows():
    manifest_data = requests.get(URL).json()
    by_trs_id: Dict[str, WorkflowInput] = {}
    for repo in manifest_data:
        for workflow in repo["workflows"]:
            if not "tests" in workflow:
                # probably fixed on main branch of iwc ?
                # this branch is pretty out of date
                continue
            workflow_input = WorkflowInput(
                active=False,
                trs_id=f'{workflow["trsID"]}/versions/v{workflow["definition"]["release"]}',
                workflow_name=workflow["definition"]["name"],
                workflow_categories=workflow["collections"],
                workflow_description=workflow["definition"]["annotation"],
                ploidy="any",
                # readme=workflow["readme"],
                # shortcut so we don't need to parse out the whole inputs section
                parameters=get_input_types(workflow["definition"]),
            )
            by_trs_id[workflow["trsID"]] = workflow_input
    return by_trs_id


def merge_into_existing():
    existing = read_existing_yaml()
    current = generate_current_workflows()
    merged: Dict[str, WorkflowInput] = {}
    for versionless_trs_id, current_workflow_input in current.items():
        existing_workflow_input = existing.get(versionless_trs_id)
        if existing_workflow_input:
            # someone has annotated ploidy and parameters, keep these, but also check
            # that existing parameters still exist
            current_workflow_input.ploidy = existing_workflow_input.ploidy
            current_workflow_input.active = existing_workflow_input.active
            # check that specified parameters still exist
            for param_key in existing_workflow_input.parameters:
                if param_key not in current_workflow_input.parameters:
                    # Should be rare, but can happen.
                    raise Exception(
                        f"{param_key} specified but is not part of updated workflow {current_workflow_input.trs_id}! Review and fix manually"
                    )
            # keep existing parameters
            current_workflow_input.parameters = existing_workflow_input.parameters
        merged[versionless_trs_id] = current_workflow_input
    return merged


def to_workflows_yaml(exclude_other: bool):
    by_trs_id = merge_into_existing()
    # sort by trs id, should play nicer with git diffs
    sorted_workflows = [w.as_dict() for w in dict(sorted(by_trs_id.items())).values()]
    if exclude_other:
        print("excluding!")
        final_workflows = []
        for workflow in sorted_workflows:
            if "OTHER" in workflow["workflow_categories"]:
                workflow["workflow_categories"].remove("OTHER")
                if not workflow["workflow_categories"]:
                    print(f'Excluding workflow {workflow["trs_id"]}, category unknown')
                    continue
            final_workflows.append(workflow)
        sorted_workflows = final_workflows
    with open(WORKFLOWS_PATH, "w") as out:
        yaml.safe_dump(
            {"workflows": final_workflows},
            out,
            sort_keys=False,
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Build workflows.yaml file from latest IWC JSON manifest."
    )
    parser.add_argument(
        "--exclude-other",
        action="store_true",
        help="Exclude other items from processing.",
    )
    args = parser.parse_args()
    to_workflows_yaml(exclude_other=args.exclude_other)
