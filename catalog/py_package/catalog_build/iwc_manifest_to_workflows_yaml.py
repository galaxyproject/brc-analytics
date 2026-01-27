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
from .qc_utils import format_list_section, join_report, write_markdown

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

# QC report reason constants
REASON_ACTIVE_VERSION_MISSING = "Active workflow version not on Dockstore"
REASON_NEWER_VERSION_UNRELEASED = "IWC has newer version not on Dockstore yet"


def parse_trs_version(trs_id: str) -> Tuple[str, str]:
    """Parse TRS ID into base and version.

    Args:
        trs_id: Full TRS ID like '#workflow/github.com/org/repo/name/versions/v1'

    Returns:
        Tuple of (base_id, version) e.g. ('#workflow/github.com/org/repo/name', '1')

    Raises:
        IndexError: If TRS ID doesn't contain '/versions/v' separator
    """
    parts = trs_id.rsplit("/versions/v", 1)
    if len(parts) != 2:
        raise IndexError(f"Invalid TRS ID format: {trs_id}")
    return parts[0], parts[1]


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
    # If no Dockstore collections are defined, treat as OTHER so behavior
    # is consistent with unmapped collections (which also become OTHER).
    if not collections:
        return [WorkflowCategoryId.OTHER]

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

    for repo in manifest_data:
        for workflow in repo["workflows"]:
            if "tests" not in workflow:
                # probably fixed on main branch of iwc ?
                # this branch is pretty out of date
                continue

            trs_id = (
                f"{workflow['trsID']}/versions/v{workflow['definition']['release']}"
            )

            # Version existence checks and mismatches are handled later
            # in merge_into_existing and the QC reporting system

            # Store original collections for QC reporting
            original_collections = (
                workflow["collections"] if workflow["collections"] else []
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
            # Attach original collections as a custom attribute for QC reporting
            workflow_input._original_collections = original_collections
            by_trs_id[workflow["trsID"]] = workflow_input

    return by_trs_id


def find_stale_parameters(
    current_workflow_input: Workflow, existing_workflow_input: Workflow
) -> List[str]:
    """Find parameters in existing workflow that no longer exist in IWC.

    Returns a list of stale parameter keys for QC reporting.
    Does NOT remove them - they are kept for manual review.
    """
    current_workflow_parameter_keys = {
        param.key for param in current_workflow_input.parameters
    }
    stale_params: List[str] = []
    for param in existing_workflow_input.parameters:
        if param.key not in current_workflow_parameter_keys:
            stale_params.append(param.key)
    return stale_params


def add_missing_parameters(
    current_workflow_input: Workflow, existing_workflow_input: Workflow
) -> List[str]:
    """Add parameters from IWC that don't exist in existing workflow.

    Returns a list of newly added parameter keys for QC reporting.
    """
    existing_parameter_keys = {
        param.key for param in existing_workflow_input.parameters
    }
    new_params: List[str] = []
    for param in current_workflow_input.parameters:
        if param.key not in existing_parameter_keys:
            existing_workflow_input.parameters.append(param)
            new_params.append(param.key)
    return new_params


def merge_into_existing(
    workflows_path: str,
    skip_validation: bool = False,
    iwc_current: Optional[Dict[str, Workflow]] = None,
    version_cache: Optional[Dict[str, bool]] = None,
) -> Tuple[
    Dict[str, Workflow],
    List[Dict[str, str]],
    List[Dict[str, str]],
    List[Dict[str, str]],
]:
    """Merge IWC manifest workflows into existing workflows.

    Returns a tuple of:
        - merged workflows dict
        - stale parameter QC items (params in existing but not in IWC)
        - new parameter QC items (params in IWC but not in existing)
        - newly added workflow QC items (workflows not previously in YAML)
    """
    existing = read_existing_yaml(workflows_path)
    current = (
        iwc_current
        if iwc_current is not None
        else generate_current_workflows(skip_validation)
    )
    if version_cache is None:
        version_cache = {}
    merged: Dict[str, Workflow] = {}
    invalid_versions = []
    versions_kept = []
    stale_param_qc_items: List[Dict[str, str]] = []
    new_param_qc_items: List[Dict[str, str]] = []
    new_workflow_qc_items: List[Dict[str, str]] = []

    for versionless_trs_id, current_workflow_input in current.items():
        existing_workflow_input = existing.get(versionless_trs_id)
        if not existing_workflow_input:
            # This is a newly added workflow from IWC
            merged[versionless_trs_id] = current_workflow_input
            trs_base = current_workflow_input.trs_id.rsplit("/versions/v", 1)[0]
            categories = [
                c.value if hasattr(c, "value") else c
                for c in current_workflow_input.categories
            ]
            new_workflow_qc_items.append(
                {
                    "trs_base": trs_base,
                    "name": current_workflow_input.workflow_name,
                    "categories": ", ".join(categories) if categories else "none",
                }
            )
            continue

        # Use cached version validation
        iwc_trs_id = current_workflow_input.trs_id
        existing_trs_id = existing_workflow_input.trs_id

        if iwc_trs_id not in version_cache:
            version_cache[iwc_trs_id] = verify_trs_version_exists(
                iwc_trs_id, skip_validation
            )
        if existing_trs_id not in version_cache:
            version_cache[existing_trs_id] = verify_trs_version_exists(
                existing_trs_id, skip_validation
            )

        iwc_version_valid = version_cache[iwc_trs_id]
        existing_version_valid = version_cache[existing_trs_id]

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
                is_active = getattr(existing_workflow_input, "active", False)
                if is_active:
                    print(
                        f"Warning: Neither existing nor IWC version exists on "
                        f"Dockstore for ACTIVE workflow {versionless_trs_id}"
                    )
                # Keep what we have
                current_workflow_input.trs_id = existing_workflow_input.trs_id

        # Build the merged workflow
        existing_dict = existing_workflow_input.model_dump()
        new_dict = current_workflow_input.model_dump()

        # Update manifest-controlled fields
        for key in MANIFEST_SOURCE_OF_TRUTH:
            existing_dict[key] = new_dict[key]

        # Find stale parameters
        is_active = getattr(existing_workflow_input, "active", False)
        trs_base = current_workflow_input.trs_id.rsplit("/versions/v", 1)[0]

        stale_params = find_stale_parameters(
            current_workflow_input, existing_workflow_input
        )

        if is_active:
            # For active workflows, keep stale params but report them for manual review
            for param_key in stale_params:
                stale_param_qc_items.append(
                    {
                        "trs_base": trs_base,
                        "param_key": param_key,
                        "active": True,
                    }
                )
        else:
            # For inactive workflows, automatically drop stale params from the merged YAML
            if stale_params and "parameters" in existing_dict:
                existing_dict["parameters"] = [
                    p
                    for p in existing_dict["parameters"]
                    if p.get("key") not in set(stale_params)
                ]

        updated_existing_workflow = Workflow(**existing_dict)

        # Add new parameters from IWC
        new_params = add_missing_parameters(
            current_workflow_input, updated_existing_workflow
        )
        for param_key in new_params:
            new_param_qc_items.append(
                {"trs_base": trs_base, "param_key": param_key, "active": is_active}
            )

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
    return merged, stale_param_qc_items, new_param_qc_items, new_workflow_qc_items


def to_workflows_yaml(
    workflows_path: str,
    exclude_other: bool,
    skip_validation: bool = False,
    qc_report_path: Optional[str] = None,
):
    # Generate IWC workflows once and create version cache
    iwc_current = generate_current_workflows(skip_validation)
    version_cache: Dict[str, bool] = {}

    by_trs_id, stale_param_qc_items, new_param_qc_items, new_workflow_qc_items = (
        merge_into_existing(workflows_path, skip_validation, iwc_current, version_cache)
    )
    # sort by trs id, should play nicer with git diffs
    sorted_workflows = list(dict(sorted(by_trs_id.items())).values())
    # Collect category information BEFORE any exclusion or category mutation
    workflows_with_other_and_valid: List[Tuple[str, List[str]]] = []
    workflows_excluded_other_only: List[str] = []
    workflows_multiple_valid: List[Tuple[str, List[str]]] = []

    for w in sorted_workflows:
        if not getattr(w, "active", False):
            continue
        trs_base = w.trs_id.rsplit("/versions/v", 1)[0]
        category_names = [
            cat.value if hasattr(cat, "value") else cat for cat in w.categories
        ]
        has_other = WorkflowCategoryId.OTHER in w.categories
        valid_categories = [
            cat for cat in w.categories if cat != WorkflowCategoryId.OTHER
        ]

        if has_other and len(valid_categories) == 1:
            # Case 1: Has OTHER + exactly one valid category
            workflows_with_other_and_valid.append((trs_base, category_names))
        elif has_other and len(valid_categories) == 0:
            # Case 2: Has ONLY OTHER (will be excluded)
            workflows_excluded_other_only.append(trs_base)
        elif len(valid_categories) > 1:
            # Case 3: Has multiple valid categories (may or may not have OTHER)
            workflows_multiple_valid.append((trs_base, category_names))
    if exclude_other:
        print("excluding!")
        final_workflows = []
        for workflow in sorted_workflows:
            if WorkflowCategoryId.OTHER in workflow.categories:
                workflow.categories.remove(WorkflowCategoryId.OTHER)
                if not workflow.categories:
                    continue
            final_workflows.append(workflow)
    else:
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
        for w in final_workflows:
            if not getattr(w, "active", False):
                continue
            used_trs_id = w.trs_id
            try:
                trs_base, used_version = parse_trs_version(used_trs_id)
            except IndexError:
                trs_base = used_trs_id.rsplit("/versions/v", 1)[0]
                used_version = "unknown"

            # Case 1: Active workflow version not on Dockstore (covers new active entries too)
            if used_trs_id not in version_cache:
                version_cache[used_trs_id] = verify_trs_version_exists(
                    used_trs_id, skip_validation=False
                )
            if not version_cache[used_trs_id]:
                iwc_trs_id = (
                    iwc_current.get(trs_base).trs_id
                    if trs_base in iwc_current
                    else None
                )
                if iwc_trs_id:
                    try:
                        _, iwc_version = parse_trs_version(iwc_trs_id)
                    except IndexError:
                        iwc_version = "unknown"
                else:
                    iwc_version = "unknown"
                version_qc_items.append(
                    {
                        "trs_base": trs_base,
                        "iwc_trs_id": iwc_trs_id or "",
                        "used_trs_id": used_trs_id,
                        "iwc_version": iwc_version,
                        "used_version": used_version,
                        "reason": REASON_ACTIVE_VERSION_MISSING,
                    }
                )

            # Case 2: We are not using IWC newest because it isn't on Dockstore (kept existing)
            if trs_base in iwc_current:
                iwc_trs_id2 = iwc_current[trs_base].trs_id
                try:
                    _, iwc_version2 = parse_trs_version(iwc_trs_id2)
                except IndexError:
                    iwc_version2 = "unknown"

                if iwc_trs_id2 not in version_cache:
                    version_cache[iwc_trs_id2] = verify_trs_version_exists(
                        iwc_trs_id2, skip_validation=False
                    )

                if iwc_version2 != used_version and not version_cache[iwc_trs_id2]:
                    version_qc_items.append(
                        {
                            "trs_base": trs_base,
                            "iwc_trs_id": iwc_trs_id2,
                            "used_trs_id": used_trs_id,
                            "iwc_version": iwc_version2,
                            "used_version": used_version,
                            "reason": REASON_NEWER_VERSION_UNRELEASED,
                        }
                    )

    # Filter QC entries to only those that correspond to workflows we actually keep
    final_workflow_bases = {
        wf.trs_id.rsplit("/versions/v", 1)[0] for wf in final_workflows
    }
    final_active_bases = {
        wf.trs_id.rsplit("/versions/v", 1)[0]
        for wf in final_workflows
        if getattr(wf, "active", False)
    }
    version_qc_items = [
        e for e in version_qc_items if e.get("trs_base") in final_active_bases
    ]
    # Filter new_workflow_qc_items to only include workflows actually written to YAML
    # (excludes OTHER-only workflows when --exclude-other is used)
    new_workflow_qc_items = [
        e for e in new_workflow_qc_items if e.get("trs_base") in final_workflow_bases
    ]

    # Collect IWC workflows not in the final YAML (excluded due to category filtering)
    excluded_iwc_workflows: List[Dict[str, str]] = []
    for trs_base, wf in iwc_current.items():
        if trs_base not in final_workflow_bases:
            # Extract category values, handling both enum and string types
            category_strs = []
            for c in wf.categories:
                if hasattr(c, "value"):
                    category_strs.append(c.value)
                elif isinstance(c, str):
                    category_strs.append(c)
                else:
                    category_strs.append(str(c))

            # Get original Dockstore collections to show why it was excluded
            original_collections = getattr(wf, "_original_collections", [])
            if original_collections:
                collections_display = f"{', '.join(category_strs)} (from Dockstore: {', '.join(original_collections)})"
            elif category_strs:
                collections_display = (
                    f"{', '.join(category_strs)} (no Dockstore collections)"
                )
            else:
                collections_display = "none"

            excluded_iwc_workflows.append(
                {
                    "name": wf.workflow_name,
                    "categories": collections_display,
                }
            )

    # Optionally write QC report
    if qc_report_path:
        write_workflows_qc_report(
            version_qc_items,
            workflows_with_other_and_valid,
            workflows_excluded_other_only,
            workflows_multiple_valid,
            stale_param_qc_items,
            new_param_qc_items,
            new_workflow_qc_items,
            excluded_iwc_workflows,
            qc_report_path,
        )


def _split_version_qc_items(
    version_qc_items: List[Dict[str, str]],
) -> Tuple[List[str], List[str]]:
    """Split version QC items into invalid versions and version mismatches.

    Returns:
        - invalid_items: Active workflows with version not on Dockstore
        - mismatch_items: Workflows not using newest IWC version
    """
    invalid_items: List[str] = []
    mismatch_items: List[str] = []

    for e in sorted(version_qc_items, key=lambda x: x.get("trs_base", "")):
        trs_base = e.get("trs_base", "unknown")
        used_version = e.get("used_version", "unknown")
        iwc_version = e.get("iwc_version", "unknown")
        reason = e.get("reason", "")

        if reason == REASON_ACTIVE_VERSION_MISSING:
            invalid_items.append(f"{trs_base} (v{used_version})")
        else:
            mismatch_items.append(
                f"{trs_base}: using v{used_version}, IWC has v{iwc_version}"
            )

    return invalid_items, mismatch_items


def _format_param_changes_by_workflow(
    stale_param_qc_items: List[Dict[str, str]],
    new_param_qc_items: List[Dict[str, str]],
) -> List[str]:
    """Format parameter changes grouped by workflow for easier review."""
    # Group by workflow
    from collections import defaultdict

    by_workflow: Dict[str, Dict[str, List[str]]] = defaultdict(
        lambda: {"stale": [], "new": [], "active": False}
    )

    for e in stale_param_qc_items:
        trs_base = e.get("trs_base", "unknown")
        by_workflow[trs_base]["stale"].append(e.get("param_key", "unknown"))
        if e.get("active"):
            by_workflow[trs_base]["active"] = True

    for e in new_param_qc_items:
        trs_base = e.get("trs_base", "unknown")
        by_workflow[trs_base]["new"].append(e.get("param_key", "unknown"))
        if e.get("active"):
            by_workflow[trs_base]["active"] = True

    if not by_workflow:
        return []

    lines: List[str] = []
    for trs_base in sorted(by_workflow.keys()):
        data = by_workflow[trs_base]
        status = "ACTIVE" if data["active"] else "inactive"
        lines.append(f"### {trs_base} ({status})")
        lines.append("")
        if data["stale"]:
            lines.append("**Stale (not in IWC, kept for review):**")
            for param in sorted(data["stale"]):
                lines.append(f"- {param}")
            lines.append("")
        if data["new"]:
            lines.append("**New (added from IWC):**")
            for param in sorted(data["new"]):
                lines.append(f"- {param}")
            lines.append("")
    return lines


def write_workflows_qc_report(
    version_qc_items: List[Dict[str, str]],
    workflows_with_other_and_valid: List[Tuple[str, List[str]]],
    workflows_excluded_other_only: List[str],
    workflows_multiple_valid: List[Tuple[str, List[str]]],
    stale_param_qc_items: List[Dict[str, str]],
    new_param_qc_items: List[Dict[str, str]],
    new_workflow_qc_items: List[Dict[str, str]],
    excluded_iwc_workflows: List[Dict[str, str]],
    out_path: str,
):
    """Write a modular Markdown QC report for workflows using shared qc_utils."""
    report_lines: List[str] = ["# Catalog Workflows QC report", ""]

    # Section 1: Newly added workflows (ephemeral - only shows on first run)
    report_lines.append("## Newly added workflows this run")
    report_lines.append("")
    report_lines.append(
        "> **Note:** This section shows workflows added to workflows.yml in this "
        "script run. On subsequent runs, these will no longer appear here. "
        "Commit or save this report if you need to track what was added."
    )
    report_lines.append("")
    new_workflow_items = [
        f"{e.get('name', 'unknown')} ({e.get('categories', 'none')})"
        for e in sorted(new_workflow_qc_items, key=lambda x: x.get("name", ""))
    ]
    if new_workflow_items:
        report_lines += [f"- {item}" for item in new_workflow_items]
        report_lines.append("")
    else:
        report_lines.append("None")
        report_lines.append("")

    # Section 2: Active workflows with invalid Dockstore version (critical)
    invalid_version_items, version_mismatch_items = _split_version_qc_items(
        version_qc_items
    )
    report_lines += format_list_section(
        "## Active workflows with version not on Dockstore", invalid_version_items
    )

    # Section 3: Workflows not using newest IWC version (informational)
    report_lines += format_list_section(
        "## Workflows not using newest IWC version (newer not on Dockstore yet)",
        version_mismatch_items,
    )

    # Section 4: Workflows with OTHER + one valid category (kept)
    other_and_valid_items = [
        f"{trs_base} (categories: {', '.join(cats)})"
        for trs_base, cats in sorted(workflows_with_other_and_valid)
    ]
    report_lines += format_list_section(
        "## Workflows with unknown category and one valid category (kept)",
        other_and_valid_items,
    )

    # Section 3: Workflows with ONLY OTHER (excluded)
    excluded_items = sorted(set(workflows_excluded_other_only))
    report_lines += format_list_section(
        "## Active workflows excluded for having only unknown category",
        excluded_items,
    )

    # Section 4: Workflows with multiple valid categories
    multiple_valid_items = [
        f"{trs_base} (categories: {', '.join(cats)})"
        for trs_base, cats in sorted(workflows_multiple_valid)
    ]
    report_lines += format_list_section(
        "## Workflows with multiple valid categories", multiple_valid_items
    )

    # Section 5: Parameter changes (stale and new, grouped by workflow)
    report_lines.append("## Parameter changes by workflow")
    report_lines.append("")
    report_lines.append(
        "> **Note:** New parameters are added to workflows.yml on each run. "
        "On subsequent runs, they will no longer appear as 'new' even if "
        "stale parameters haven't been addressed yet. If you see both stale "
        "and new params for a workflow, commit or save this report before "
        "re-running so you don't lose the pairing info (useful for identifying "
        "renames)."
    )
    report_lines.append("")
    if stale_param_qc_items or new_param_qc_items:
        report_lines += _format_param_changes_by_workflow(
            stale_param_qc_items, new_param_qc_items
        )
    else:
        report_lines.append("None")
        report_lines.append("")

    # Section: IWC workflows not in workflows.yml (excluded due to category filtering)
    excluded_items = [
        f"{e.get('name', 'unknown')} ({e.get('categories', 'none')})"
        for e in sorted(excluded_iwc_workflows, key=lambda x: x.get("name", ""))
    ]
    report_lines += format_list_section(
        "## IWC workflows not in workflows.yml (excluded by category filter)",
        excluded_items,
    )

    write_markdown(out_path, join_report(report_lines))


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
