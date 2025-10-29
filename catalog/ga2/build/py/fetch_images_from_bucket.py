import os

import boto3
import botocore
from botocore.client import Config

# --- Configuration ---
ENDPOINT_URL = "https://js2.jetstream-cloud.org:8001"
BUCKET_NAME = "genomeark"
FOLDER_PREFIX = "images/"  # The S3-key prefix for the folder you want to download
LOCAL_DOWNLOAD_DIR = "./public/organism_image"  # The local folder to save files to


def download_s3_folder_public(endpoint, bucket, prefix, local_dir):
    """
    Downloads all objects from a public S3-compatible bucket path (prefix)
    to a local directory, maintaining the folder structure.
    """
    print(f"Connecting to S3 endpoint: {endpoint}")

    # 1. Configure the S3 client for anonymous access and the custom endpoint
    try:
        s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            config=Config(signature_version=botocore.UNSIGNED),
        )
    except Exception as e:
        print(f"Error initializing S3 client: {e}")
        return

    # Ensure the local download directory exists
    os.makedirs(local_dir, exist_ok=True)

    # 2. List all objects with the specified prefix
    # 'list_objects_v2' is used to get the list of files (keys)
    paginator = s3_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket, Prefix=prefix)

    file_count = 0

    print(f"Searching for files under '{bucket}/{prefix}'...")

    for page in pages:
        if "Contents" not in page:
            continue

        # 3. Iterate and download each file
        for obj in page["Contents"]:
            object_key = obj["Key"]

            # Skip keys that are just the folder itself (e.g., 'images/')
            if object_key.endswith("/"):
                continue

            # Construct the local path to maintain the folder structure
            # e.g., 'images/sub/file.jpg' -> './genomeark_images/sub/file.jpg'
            relative_key = object_key.replace(prefix, "", 1)
            local_file_path = os.path.join(local_dir, relative_key)

            # Create subdirectories if they don't exist
            local_subdir = os.path.dirname(local_file_path)
            if local_subdir:
                os.makedirs(local_subdir, exist_ok=True)

            try:
                # Download the file
                s3_client.download_file(
                    Bucket=bucket, Key=object_key, Filename=local_file_path
                )
                print(f"Downloaded: {object_key}")
                file_count += 1

            except botocore.exceptions.ClientError as e:
                print(f"Error downloading {object_key}: {e}")
            except Exception as e:
                print(f"An unexpected error occurred for {object_key}: {e}")

    print(f"\nDownload complete! {file_count} files saved to '{local_dir}'.")


# Run the function
download_s3_folder_public(ENDPOINT_URL, BUCKET_NAME, FOLDER_PREFIX, LOCAL_DOWNLOAD_DIR)
