#!/usr/bin/env python3
import json
from urllib.parse import urljoin

import boto3
import requests
from botocore import UNSIGNED
from botocore.client import Config
from bs4 import BeautifulSoup

# Configuration


def add_data_to_resources_dict(
    resources_dict: dict,
    assembly_name: str,
    category: str,
    resource_type: str,
    resource_url: str,
    resource_file_url: str,
):
    resources_dict.setdefault(assembly_name, {}).setdefault(category, {}).setdefault(
        resource_type, {"files": [], "resource_url": resource_url}
    )["files"].append(resource_file_url)


def find_vgp_bucket_resources(project_resources: dict):
    ENDPOINT_URL = "https://js2.jetstream-cloud.org:8001"
    BUCKET_NAME = "genomeark"
    PREFIX = "alignment"

    # Create unsigned S3 client
    s3 = boto3.client(
        "s3", endpoint_url=ENDPOINT_URL, config=Config(signature_version=UNSIGNED)
    )

    # Paginate results in case there are many objects
    paginator = s3.get_paginator("list_objects_v2")

    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=PREFIX):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            category = "assembly"
            if ".2bit" in key or ".fa.gz" in key:
                resource_type = "2bit"
                if key.endswith(".fa.gz"):
                    if "families" in key:
                        resource_type = "repeatmodeler"
                        category = "repeat"
                    else:
                        resource_type = "assembly"

                assembly_name = ".".join(key.split("/")[-1].split(".")[0:2])
                resource_type = key.split("/")[-1]
                add_data_to_resources_dict(
                    resources_dict=project_resources,
                    assembly_name=assembly_name,
                    resource_type=resource_type,
                    category=category,
                    resource_url=f"{ENDPOINT_URL}/{BUCKET_NAME}/{key}",
                    resource_file_url=f"{ENDPOINT_URL}/{BUCKET_NAME}/{key}",
                )


def find_galaxyproject_resources(project_resources: dict):
    categories = {
        "bowtie_index": "indices",
        "bwa_mem_index": "indices",
        "hisat_index": "indices",
        "hisat2_index": "indices",
        "rnastar_index": "indices",
        "sam_fasta_index": "assembly",
        "seq": "assembly",
        "len": "assembly",
    }
    BASE_URL = "http://datacache.galaxyproject.org/vgp/data/genomes/"

    def list_links(url):
        """Return href links (absolute URLs) for a directory index."""
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href in ("../", "/", ""):
                continue
            yield urljoin(url, href)

    def create_name_and_version(url, resource_type, resource_version):
        if "rnastar_index" in resource_type:
            return f"RNAStar Index {resource_version}"
        elif resource_type in ["seq", "len", "sam_fasta_index"]:
            return resource_type
        else:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            data = r.json()
            return data["processor_description"]["data_tables"][0]["name"]

    def scrape_recursive(url, data):
        version_dict = {}
        for link in list_links(url):
            if link.endswith("/"):  # it's a subfolder
                scrape_recursive(link, data)
            else:
                parts = link.split("/")
                assembly_name = parts[6]
                resource_type = parts[7]
                resource_version = parts[8]
                resource_url = "http:/" + "/".join(parts[1:10])
                resource_file_url = link
                category = categories.get(resource_type, "other")
                key = f"{assembly_name}{resource_type}{resource_version}"
                if key in version_dict:
                    resource_type = version_dict[key]
                else:
                    try:
                        resource_type = create_name_and_version(
                            resource_url + "/_gx_data_bundle_index.json",
                            resource_type,
                            resource_version,
                        )
                        version_dict[key] = resource_type
                    except Exception as e:
                        pass
                if resource_type == "sam_fasta_index":
                    if resource_file_url.endswith(".fai"):
                        resource_url = link
                        resource_type = parts[-1]
                    else:
                        continue
                elif resource_type == "len":
                    resource_url = link
                    resource_type = parts[-1]
                    resource_version = "v1"
                elif resource_type == "seq":
                    if resource_file_url.endswith(".2bit"):
                        # We get this from genomeark bucket
                        # resource_url = link
                        # resource_type = "2bit"
                        continue
                    elif resource_file_url.endswith(".fa"):
                        # We get this from genomeark bucket
                        # resource_url = link
                        # resource_type = "fa"
                        continue
                    else:
                        continue

                if category == "other":
                    raise ValueError(f"Unknown resource type: {resource_type}")
                add_data_to_resources_dict(
                    data,
                    assembly_name,
                    category,
                    resource_type,
                    resource_url,
                    resource_file_url,
                )

    scrape_recursive(BASE_URL, project_resources)


resources = {}
find_vgp_bucket_resources(resources)
find_galaxyproject_resources(resources)

print(json.dumps(resources, indent=2))
