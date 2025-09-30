import argparse
import json
import os
import re
import subprocess
import time
from typing import Dict, List, Optional, Tuple

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
) -> Tuple[Dict[str, Workflow], List[Dict[str, str]]]:
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

    # QC entries are now computed centrally in to_workflows_yaml
    return merged, []


def to_workflows_yaml(
    workflows_path: str,
    exclude_other: bool,
    skip_validation: bool = False,
    qc_report_path: Optional[str] = None,
):
    by_trs_id, _ = merge_into_existing(workflows_path, skip_validation)
    # sort by trs id, should play nicer with git diffs
    sorted_workflows = list(dict(sorted(by_trs_id.items())).values())
    # Collect unknown category workflows BEFORE any exclusion or category mutation
    unknown_category_workflows: List[str] = []
    for w in sorted_workflows:
        if getattr(w, "active", False) and WorkflowCategoryId.OTHER in w.categories:
            # Report versionless TRS base for readability
            unknown_category_workflows.append(w.trs_id.rsplit("/versions/v", 1)[0])
    if exclude_other:
        print("excluding!")
        final_workflows = []
        for workflow in sorted_workflows:
            if WorkflowCategoryId.OTHER in workflow.categories:
                workflow.categories.remove(WorkflowCategoryId.OTHER)
                if not workflow.categories:
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

    # Compute version-related QC entries centrally based on the final written workflows
    version_qc_items: List[Dict[str, str]] = []
    if not skip_validation:
        iwc_current = generate_current_workflows(skip_validation)
        for w in final_workflows:
            if not getattr(w, "active", False):
                continue
            used_trs_id = w.trs_id
            trs_base = used_trs_id.rsplit("/versions/v", 1)[0]
            try:
                used_version = used_trs_id.rsplit("/versions/v", 1)[1]
            except Exception:
                used_version = "unknown"

            # Case 1: Active workflow version not on Dockstore (covers new active entries too)
            if not verify_trs_version_exists(used_trs_id, skip_validation=False):
                iwc_trs_id = (
                    iwc_current.get(trs_base).trs_id
                    if trs_base in iwc_current
                    else None
                )
                try:
                    iwc_version = (
                        iwc_trs_id.rsplit("/versions/v", 1)[1]
                        if iwc_trs_id
                        else "unknown"
                    )
                except Exception:
                    iwc_version = "unknown"
                version_qc_items.append(
                    {
                        "trs_base": trs_base,
                        "iwc_trs_id": iwc_trs_id or "",
                        "used_trs_id": used_trs_id,
                        "iwc_version": iwc_version,
                        "used_version": used_version,
                        "reason": "Active workflow version not on Dockstore",
                    }
                )

            # Case 2: We are not using IWC newest because it isn't on Dockstore (kept existing)
            if trs_base in iwc_current:
                iwc_trs_id2 = iwc_current[trs_base].trs_id
                try:
                    iwc_version2 = iwc_trs_id2.rsplit("/versions/v", 1)[1]
                except Exception:
                    iwc_version2 = "unknown"
                if iwc_version2 != used_version and not verify_trs_version_exists(
                    iwc_trs_id2, skip_validation=False
                ):
                    version_qc_items.append(
                        {
                            "trs_base": trs_base,
                            "iwc_trs_id": iwc_trs_id2,
                            "used_trs_id": used_trs_id,
                            "iwc_version": iwc_version2,
                            "used_version": used_version,
                            "reason": "IWC has newer version not on Dockstore yet",
                        }
                    )

    # Filter QC entries to only those that correspond to workflows we actually keep and are active
    final_active_bases = {
        wf.trs_id.rsplit("/versions/v", 1)[0]
        for wf in final_workflows
        if getattr(wf, "active", False)
    }
    version_qc_items = [
        e for e in version_qc_items if e.get("trs_base") in final_active_bases
    ]

    # Optionally write QC report
    if qc_report_path:
        write_workflows_qc_report(
            version_qc_items, unknown_category_workflows, qc_report_path
        )


def _section_header(title: str) -> List[str]:
    return [
        title,
        "",
    ]


def _format_list_section(title: str, items: List[str]) -> List[str]:
    lines = _section_header(title)
    if not items:
        lines += ["None", ""]
    else:
        lines += [f"- {item}" for item in items] + [""]
    return lines


def _format_version_mismatch_items(version_qc_items: List[Dict[str, str]]) -> List[str]:
    if not version_qc_items:
        return []
    items: List[str] = []
    for e in sorted(version_qc_items, key=lambda x: x.get("trs_base", "")):
        items.append(
            "{trs_base} used v{used_version} vs IWC v{iwc_version} ({reason})".format(
                trs_base=e.get("trs_base", "unknown"),
                used_version=e.get("used_version", "unknown"),
                iwc_version=e.get("iwc_version", "unknown"),
                reason=e.get("reason", ""),
            )
        )
    return items


def write_workflows_qc_report(
    version_qc_items: List[Dict[str, str]],
    unknown_category_workflows: List[str],
    out_path: str,
):
    """Write a modular Markdown QC report for workflows."""
    report_lines: List[str] = ["# Catalog Workflows QC report", ""]

    # Section: Version mismatches or unavailable versions
    version_items = _format_version_mismatch_items(version_qc_items)
    report_lines += _format_list_section(
        "## Workflows not using newest IWC version", version_items
    )

    # Section: Unknown categories (active only)
    unknown_items = sorted(set(unknown_category_workflows))
    report_lines += _format_list_section(
        "## Workflows with unknown categories", unknown_items
    )

    report = "\n".join(report_lines)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as fh:
        fh.write(report)


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
    parser.add_argument(
        "--qc-report-path",
        dest="qc_report_path",
        default="catalog/output/qc-report.workflows.md",
        help=(
            "Optional path to write workflows QC report (default: catalog/output/qc-report.workflows.md)."
        ),
    )
    args = parser.parse_args()
    to_workflows_yaml(
        args.workflows_path,
        exclude_other=args.exclude_other,
        skip_validation=args.skip_validation,
        qc_report_path=args.qc_report_path,
    )
