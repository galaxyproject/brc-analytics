# Gene snapshot release: design

How a gene snapshot reaches the servers. The gene catalog contract (#1893, section 5, "Releasing and serving") says what every release guarantees; this document says how they are met. Built in #1925.

## Terms

- **Gene snapshot:** one DuckDB file holding the tables the gene API reads, written by `catalog_build.genes.build_gene_snapshot`. Identified by its build ID, which the file's `snapshot` table holds.
- **Gene data store:** the S3 bucket holding published snapshots under `snapshots/`. For now a temporary AWS bucket on the Clever Canary account, used only until the gene data store's bucket on Jetstream2 is available.
- **Snapshot pin:** `backend/api/app/data/genes/snapshot-pin.json`, the file in the repo naming the one snapshot a release serves.
- **Pinned mode:** how the servers run. The API downloads the pinned snapshot at startup and serves it.
- **Local mode:** how a developer's machine runs. The API serves a snapshot file named by `GENE_SNAPSHOT_PATH`.

## The snapshot pin

```json
{
  "build_id": "temp-GCF_000002765.6-2026-10-28T212348Z",
  "url": "https://<bucket>.s3.<region>.amazonaws.com/snapshots/temp-GCF_000002765.6-2026-10-28T212348Z.duckdb",
  "sha256": "<64 hex digits>",
  "size": 12345678,
  "schema_version": 1
}
```

The publish command writes it; nobody edits it by hand. It is inside the backend's Docker build context, so each image carries its own pin, and its git history is the record of which snapshot each release served.

## Publishing a snapshot

From `catalog/py_package`, with AWS credentials that can write to the bucket:

```bash
python -m catalog_build.genes.publish_gene_snapshot \
  --snapshot genes.duckdb --bucket <bucket>
```

1. Reads the build ID and `schema_version` from the snapshot, and hashes the file.
2. Uploads it to `snapshots/<build_id>.duckdb` with `IfNoneMatch: *`, so a published snapshot is never replaced and a pin always names the file it was written for. S3 checks the upload against its SHA-256. If the key is already there, as when an earlier run uploaded the file but stopped before writing the pin, the run goes on to the next step, which refuses any file but this one.
3. Reads the object's size and checksum back from the store, and stops without a pin if they don't match the file.
4. Writes the pin.

Then commit the pin in a pull request.

## Releasing

A pin change is released like any code change: merging it to `main` releases it to dev, and the next production release carries it from dev. Code and snapshot always move as a pair, so production serves exactly what was tested together on dev. Rollback is redeploying an earlier release, which brings its pin with it; the data is never rolled back alone.

CI runs `test_the_committed_pin_is_one_this_release_reads` in the backend tests, which fails a pin whose `schema_version` the release's backend can't read or whose URL isn't under `snapshots/`. CI checks the pin, not the file it names: CI runs outside TACC, so it can't download the snapshot. The publish command takes the pin's values from the file, so they disagree only if the pin is edited by hand, and then dev refuses the snapshot at startup (below).

## Serving

The backend chooses its mode from one setting:

- **`GENE_SNAPSHOT_PATH` unset: pinned mode.** The servers run this way, as does the Docker stack in CI; the backend's unit tests use local mode. It is never set in `backend/api/.env.example`, which `docker-compose.yml` loads on the servers too; a test checks that.
- **`GENE_SNAPSHOT_PATH` set: local mode.** The API opens that file and checks only its `schema_version`. Never set it on a server.

`ENVIRONMENT` doesn't choose the mode: it defaults to `development` when unset, and the dev server's value is in the same group as a laptop's, so a misconfigured server would look local.

### Download (pinned mode)

At startup the app's lifespan starts a background thread, so the download never holds up a deploy. Until the snapshot is ready, gene requests return 503 and everything else is served.

1. Read the pin, and check its `schema_version` is the backend's.
2. If `<build_id>.duckdb` is already in the download directory (`GENE_SNAPSHOT_DIR`, `/data/genes` in the container) with the pinned size and SHA-256, as when the same container restarts, open it without downloading.
3. Check the directory has room for the pinned size. Open `<build_id>.duckdb.partial` there, so a directory that can't be written to fails before any request, then stream the file into it from the pin's URL, hashing as it goes and stopping as soon as it exceeds the pinned size.
4. Check the size and SHA-256 match the pin, then rename the file into place.
5. Open it, and check its `snapshot` table has the pin's build ID and the backend's `schema_version`. The checksum proves the file is the one published; this proves the pin describes it.

`/data/genes` is created in the image and has no volume: each new container downloads its own release's snapshot, and the old file goes with the old container. A restarted container keeps its file, so it reuses it (step 2).

**Failures.** Network, HTTP, disk and permission failures are retried, after waiting 30 seconds, 1, 2 and 4 minutes: five attempts in all. Then the API gives up until it is restarted. A pin of another `schema_version`, and a file that isn't what the pin describes (wrong size, checksum, build ID or `schema_version`), aren't retried, since trying again can't change them. Either way the reason is logged, the partial file is deleted, and gene requests return 503. The API never falls back to another snapshot. Shutdown stops the download, including during a wait.

### Opening the snapshot

The snapshot is opened read-only, with DuckDB locked down so that a file from outside the app can't reach anything beyond itself:

- `enable_external_access = false`: no other files, no network, no `ATTACH` or `COPY`.
- Extension autoinstall and autoload off.
- `temp_directory` is an empty directory of the process's own. DuckDB lets a connection without external access use anything under its temp directory, so it is never the system's.
- `memory_limit = 1GB`.
- `lock_configuration = true`, so none of the above can be changed once open.

The service then checks the `schema_version` and runs each of its queries once, so a snapshot of another shape is refused at startup, not on every request.

### Health

`GET /api/v1/health` stays `"status": "healthy"` whatever the gene data's state, because Docker's healthcheck uses it and gene data failing must not take the API down. It adds:

```json
"genes": { "status": "loading" | "ready" | "unavailable", "source": "pinned" | "local", "build_id": "…" | null }
```

The endpoint is public, so it gives only this; the reasons are in the log. It is how to check a deploy without logging in to the server.

## The gene data store

The servers read `snapshots/` without credentials, so no key reaches the servers or the deploy playbook. The bucket is set up once, by hand, by whoever holds the account's credentials (no setup script in the repo):

- **Read:** a bucket policy allowing `s3:GetObject` on `snapshots/*` only from `aws:SourceIp` `129.114.0.0/16`, the TACC block the BRC servers are in (prod 129.114.102.29, dev 129.114.102.31).
- **No listing:** the policy grants no `s3:ListBucket`.
- **Write:** only the publishers' credentials.
- **Versioning on,** so a deleted snapshot can be restored by hand.
- **Never delete a published snapshot.** `IfNoneMatch` stops an overwrite but not a delete followed by a new upload under the same build ID, and every release pinning that ID, including rollback targets, would then fail its checksum and serve no gene data. To withdraw a snapshot, publish a new build and release a new pin.
- **Server access logging on.** Refused requests are logged with their source address, so the servers' real outbound address can be confirmed without logging in to them, and the allowlist narrowed to it.

The snapshots hold only public NCBI data; the allowlist keeps anonymous traffic, and the transfer cost it brings, off the bucket. Moving to the Jetstream2 bucket is a new pin pointing at the new URL, released like any other; the publish command's `snapshot_url` is the one AWS-specific part to change (its docstring says how).

| Bucket                      | Region      | Account                          | Access logs                                                     |
| --------------------------- | ----------- | -------------------------------- | --------------------------------------------------------------- |
| `cc-brc-gene-snapshots-dev` | `us-east-1` | Clever Canary dev (708377107803) | `cc-brc-gene-snapshots-dev-logs/gene-snapshots/`, kept 180 days |

All four S3 public-access blocks are on: S3 doesn't count a policy limited to an IP range as public. The bucket also denies requests not over TLS, encrypts with SSE-S3, and has ACLs off. Bucket names here have no dots, because the servers download from `https://<bucket>.s3.<region>.amazonaws.com/`, which S3's certificate covers only for names without them.

## Local development

The gene data store serves only the servers, so a developer builds a snapshot from NCBI's public files instead. From `catalog/py_package`, with the catalog build's requirements installed:

```bash
python -m catalog_build.genes.build_gene_snapshot \
  --assembly GCF_000002765.6 \
  --gff3 https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/002/765/GCF_000002765.6_GCA_000002765/GCF_000002765.6_GCA_000002765_genomic.gff.gz \
  --out ~/genes-3d7.duckdb
```

Then set `GENE_SNAPSHOT_PATH` to the file's absolute path in `backend/api/.env`, and run the API outside Docker (`uv run uvicorn app.main:create_app --factory`): `docker-compose.yml` doesn't mount the file into the container. The health check shows `"source": "local"`.

## Tests

The backend's tests read a small gene snapshot kept as text in `backend/api/tests/data/gene_snapshot/`: four of 3D7's genes, exported with DuckDB's `EXPORT DATABASE` and imported into a temporary file when the tests start. It is a copy of the build's output at one point in time, so a change to the snapshot's tables needs it exported again; changing `SCHEMA_VERSION` without doing so fails the backend's tests, which is the reminder. The build's own tests are in `catalog/py_package/tests/test_genes_build_gene_snapshot.py`.

## Not yet

- **Older-update check.** The contract's check that a pin never names a snapshot built from an older provenance database update than the one it replaces comes with the real build; the temporary snapshots have no update.
- **Jetstream2 bucket.** The AWS bucket above is a stand-in until the gene data store's bucket on Jetstream2 exists. Then: create it with the same access rules (Jetstream2's Ceph store supports bucket policies; check `aws:SourceIp`), give the publish command an `--endpoint-url` and a path-style URL in `snapshot_url`, publish, and release the new pin. The AWS buckets can be deleted once no release in use pins them.
