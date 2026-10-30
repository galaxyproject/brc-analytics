"""Publish a gene snapshot: upload it to the gene data store and write the pin
that releases it with the code.

    python -m catalog_build.genes.publish_gene_snapshot \\
        --snapshot genes.duckdb --bucket <bucket>

(run from catalog/py_package, with AWS credentials that can write to the
bucket, e.g. AWS_PROFILE=<profile>). The snapshot goes to snapshots/<build_id>.duckdb, which is never
overwritten, and the pin is written to the backend, ready to commit: merging
it releases the snapshot with the code, to dev and then production. The
design is in catalog/docs/gene-catalog/gene-snapshot-release-design.md.
"""

import argparse
import base64
import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import boto3
import duckdb
from botocore.exceptions import ClientError

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_PIN = (
    REPO_ROOT / "backend" / "api" / "app" / "data" / "genes" / "snapshot-pin.json"
)

# The build IDs the backend accepts in a pin (GeneSnapshotPin): the ID also
# names the snapshot's key, which can't be replaced once uploaded.
BUILD_ID = re.compile(r"[A-Za-z0-9._-]+")


def snapshot_identity(path: Path) -> Dict[str, Any]:
    """The snapshot's build ID and schema version, as its snapshot table has them."""
    con = duckdb.connect(str(path), read_only=True)
    try:
        row = con.execute("SELECT build_id, schema_version FROM snapshot").fetchone()
    finally:
        con.close()
    if row is None:
        raise ValueError(f"{path}: its snapshot table is empty")
    return {"build_id": row[0], "schema_version": row[1]}


def file_sha256(path: Path) -> bytes:
    with path.open("rb") as f:
        return hashlib.file_digest(f, "sha256").digest()


def snapshot_url(s3: Any, bucket: str, key: str) -> str:
    """The URL the servers download the snapshot from.

    Built from the bucket's own region, as S3 reports it, not the client's:
    an upload through a client of another region still succeeds, because the
    client follows S3's redirect, but the servers don't follow redirects.
    get_bucket_location reports no region for us-east-1.

    AWS only. An S3-compatible store such as Jetstream2's (Ceph) has one site
    and its own endpoint, with the bucket in the path: there the URL would be
    f"{endpoint}/{bucket}/{key}", with the endpoint passed to the client as
    endpoint_url. Nothing else here or in the backend depends on the store.
    """
    region = s3.get_bucket_location(Bucket=bucket).get("LocationConstraint")
    return f"https://{bucket}.s3.{region or 'us-east-1'}.amazonaws.com/{key}"


def publish_gene_snapshot(
    snapshot: Path, bucket: str, pin_path: Path, s3: Any
) -> Dict[str, Any]:
    """Upload the snapshot, check the store holds it, and write its pin."""
    identity = snapshot_identity(snapshot)
    if not BUILD_ID.fullmatch(identity["build_id"]):
        raise ValueError(
            f"{snapshot}: build ID {identity['build_id']!r} isn't one a pin can name"
        )
    sha256 = file_sha256(snapshot)
    checksum = base64.b64encode(sha256).decode()
    size = snapshot.stat().st_size
    key = f"snapshots/{identity['build_id']}.duckdb"

    with snapshot.open("rb") as body:
        # IfNoneMatch: a published snapshot is never replaced, so a pin always
        # names the file it was written for. S3 checks the upload against
        # the checksum.
        try:
            s3.put_object(
                Bucket=bucket,
                Key=key,
                Body=body,
                ChecksumSHA256=checksum,
                IfNoneMatch="*",
            )
        except ClientError as exc:
            # Already published: fine if it is this file, as when an earlier
            # run uploaded it but couldn't write the pin; the check below
            # refuses any other.
            if exc.response["Error"]["Code"] != "PreconditionFailed":
                raise
    stored = s3.head_object(Bucket=bucket, Key=key, ChecksumMode="ENABLED")
    if stored["ContentLength"] != size or stored.get("ChecksumSHA256") != checksum:
        raise RuntimeError(f"s3://{bucket}/{key} doesn't match {snapshot}")

    pin = {
        "build_id": identity["build_id"],
        "url": snapshot_url(s3, bucket, key),
        "sha256": sha256.hex(),
        "size": size,
        "schema_version": identity["schema_version"],
    }
    pin_path.parent.mkdir(parents=True, exist_ok=True)
    pin_path.write_text(json.dumps(pin, indent=2) + "\n")
    return pin


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(
        description="Upload a gene snapshot to the gene data store and pin it."
    )
    parser.add_argument("--snapshot", required=True, type=Path, help="DuckDB file")
    parser.add_argument("--bucket", required=True, help="Gene data store bucket")
    parser.add_argument(
        "--pin", type=Path, default=DEFAULT_PIN, help="Pin file to write"
    )
    args = parser.parse_args(argv)
    s3 = boto3.client("s3")
    pin = publish_gene_snapshot(args.snapshot, args.bucket, args.pin, s3)
    print(f"Published {pin['url']}\nPinned in {args.pin}")


if __name__ == "__main__":
    main()
