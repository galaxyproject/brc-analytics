import base64
import hashlib
import json

import boto3
import duckdb
import pytest
from botocore.stub import ANY, Stubber
from catalog_build.genes import publish_gene_snapshot as pgs

BUILD_ID = "temp-GCF_000002765.6-2026-10-28T212348Z"
KEY = f"snapshots/{BUILD_ID}.duckdb"


def make_snapshot(path, build_id=BUILD_ID):
    con = duckdb.connect(str(path))
    con.execute("CREATE TABLE snapshot (build_id VARCHAR, schema_version INTEGER)")
    con.execute("INSERT INTO snapshot VALUES (?, 1)", [build_id])
    con.close()
    return path


@pytest.fixture
def snapshot(tmp_path):
    return make_snapshot(tmp_path / "genes.duckdb")


@pytest.fixture
def s3():
    client = boto3.client(
        "s3",
        region_name="us-west-2",
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )
    with Stubber(client) as stubber:
        yield client, stubber
        stubber.assert_no_pending_responses()


def expect_upload(
    stubber, snapshot, stored_size=None, already_published=False, region="us-west-2"
):
    content = snapshot.read_bytes()
    checksum = base64.b64encode(hashlib.sha256(content).digest()).decode()
    if already_published:
        stubber.add_client_error(
            "put_object", service_error_code="PreconditionFailed", http_status_code=412
        )
    else:
        stubber.add_response(
            "put_object",
            {},
            {
                "Bucket": "genes",
                "Key": KEY,
                "Body": ANY,
                "ChecksumSHA256": checksum,
                "IfNoneMatch": "*",
            },
        )
    stubber.add_response(
        "head_object",
        {
            "ContentLength": len(content) if stored_size is None else stored_size,
            "ChecksumSHA256": checksum,
        },
        {"Bucket": "genes", "Key": KEY, "ChecksumMode": "ENABLED"},
    )
    if stored_size is None:
        stubber.add_response(
            "get_bucket_location",
            {"LocationConstraint": region} if region else {},
            {"Bucket": "genes"},
        )
    return content


def test_publish_uploads_the_snapshot_and_writes_its_pin(tmp_path, snapshot, s3):
    client, stubber = s3
    content = expect_upload(stubber, snapshot)
    # The pin's folder needn't exist yet.
    pin_path = tmp_path / "genes" / "snapshot-pin.json"

    pgs.publish_gene_snapshot(snapshot, "genes", pin_path, client)

    assert json.loads(pin_path.read_text()) == {
        "build_id": BUILD_ID,
        "url": f"https://genes.s3.us-west-2.amazonaws.com/{KEY}",
        "sha256": hashlib.sha256(content).hexdigest(),
        "size": len(content),
        "schema_version": 1,
    }


def test_the_url_names_the_buckets_own_region(tmp_path, snapshot, s3):
    # The client is us-west-2's; the bucket is us-east-1's, for which S3
    # reports no region.
    client, stubber = s3
    expect_upload(stubber, snapshot, region=None)
    pin = pgs.publish_gene_snapshot(
        snapshot, "genes", tmp_path / "snapshot-pin.json", client
    )
    assert pin["url"] == f"https://genes.s3.us-east-1.amazonaws.com/{KEY}"


def test_publishing_the_same_file_again_writes_its_pin(tmp_path, snapshot, s3):
    # As when an earlier run uploaded the file but couldn't write the pin.
    client, stubber = s3
    expect_upload(stubber, snapshot, already_published=True)
    pin_path = tmp_path / "snapshot-pin.json"
    pgs.publish_gene_snapshot(snapshot, "genes", pin_path, client)
    assert json.loads(pin_path.read_text())["build_id"] == BUILD_ID


def test_a_published_snapshot_is_never_replaced(tmp_path, snapshot, s3):
    # Another file under the same build ID: the store keeps what it has.
    client, stubber = s3
    expect_upload(stubber, snapshot, stored_size=1, already_published=True)
    pin_path = tmp_path / "snapshot-pin.json"
    with pytest.raises(RuntimeError, match="doesn't match"):
        pgs.publish_gene_snapshot(snapshot, "genes", pin_path, client)
    assert not pin_path.exists()


def test_other_upload_errors_stop_publishing(tmp_path, snapshot, s3):
    client, stubber = s3
    stubber.add_client_error(
        "put_object", service_error_code="AccessDenied", http_status_code=403
    )
    pin_path = tmp_path / "snapshot-pin.json"
    with pytest.raises(client.exceptions.ClientError, match="AccessDenied"):
        pgs.publish_gene_snapshot(snapshot, "genes", pin_path, client)
    assert not pin_path.exists()


def test_no_pin_unless_the_store_holds_the_file(tmp_path, snapshot, s3):
    client, stubber = s3
    expect_upload(stubber, snapshot, stored_size=1)
    pin_path = tmp_path / "snapshot-pin.json"
    with pytest.raises(RuntimeError, match="doesn't match"):
        pgs.publish_gene_snapshot(snapshot, "genes", pin_path, client)
    assert not pin_path.exists()


def test_a_build_id_a_pin_cant_name_is_not_uploaded(tmp_path, s3):
    # The stubbed client fails the test on any call it wasn't told to expect.
    client, _ = s3
    snapshot = make_snapshot(tmp_path / "genes.duckdb", build_id="genes/3d7")
    pin_path = tmp_path / "snapshot-pin.json"
    with pytest.raises(ValueError, match="isn't one a pin can name"):
        pgs.publish_gene_snapshot(snapshot, "genes", pin_path, client)
    assert not pin_path.exists()
