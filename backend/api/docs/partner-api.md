# Logan partner API

This API lets a partner service run Logan searches on BRC Analytics. It runs
the same pipeline as the Logan search on brc-analytics.org: `kmindex_query` on Galaxy, with the
per-index outputs merged, FP-corrected and joined to SRA run metadata.

Access is **time-boxed**. Every response carries a `Sunset` header with the
agreed end date. After that date every call returns `410 Gone`.

Base URL: `https://brc-analytics.org/api/v1/partner/logan`

## Authentication

Send your key with every request:

```
X-API-Key: <your key>
```

A missing or wrong key gets `401`. Keep the key on your server. The API is
meant to be called server-to-server, not from a browser.

## Limits

- 20 submissions per hour.
- 300 requests per minute across all other calls.

Going over either returns `429` with `Retry-After`. The rules for what you can
submit are the same as on brc-analytics.org:

- one FASTA record per search
- up to 2,500 bases
- one or more indexes per search

## The flow

```
POST /jobs                 -> 202 {job_id, status_url, results_url, export_url}
GET  /jobs/{id}            -> 202 + Retry-After while running, 200 when done
GET  /jobs/{id}/results    -> 202 until merged, then a page of hits
GET  /jobs/{id}/export     -> every hit, as TSV (or parquet)
```

`status_url`, `results_url` and `export_url` are paths relative to the host.

### List the indexes

```sh
curl -H "X-API-Key: $KEY" $BASE/indexes
# {"count": 109, "indexes": ["GENOMIC_BCT", "METAGENOMIC_ENV", ...]}
```

### Submit

```sh
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
     -H "Idempotency-Key: 6f1c...-any-unique-string" \
     -d '{"sequence": ">q\nACGT...", "indexes": ["GENOMIC_BCT"], "threshold": 0.5, "zvalue": 6}' \
     $BASE/jobs
```

| Field       | Default | Meaning                                                   |
| ----------- | ------- | --------------------------------------------------------- |
| `sequence`  | --      | One FASTA record, up to 2,500 bases                       |
| `indexes`   | --      | Index names from `/indexes`                               |
| `threshold` | 0.0     | Minimum share of k-mers a run must contain (kmindex `-r`) |
| `zvalue`    | 6       | z for findere, kmindex's false-positive filter (`-z`)     |

**Send an `Idempotency-Key`.** A submission can time out after the job has
already started. If you retry with the same key and the same body within 24
hours, you get the original `job_id` back instead of a second search across
every index. A `409` means one of these:

- The key was reused with a different body.
- The first submission is still in flight. Wait a few seconds and send it
  again. If it's still in flight after a minute, it was interrupted and is in
  the same spot as the next case.
- The first submission failed in a way that leaves it unclear whether Galaxy
  started the job. We won't guess, so check your earlier responses, and send a
  new key if you do want to submit again.

If we can't record the key at all, the submit is refused with `503` rather
than run without that protection.

### Poll

```sh
curl -H "X-API-Key: $KEY" $BASE/jobs/$JOB_ID
# 202 {"job_id": "...", "state": "running", "is_complete": false, "is_successful": false, ...}
```

The response is `202` while the job runs and `200` once it has finished,
successfully or not.

**Honor `Retry-After`.** Status only changes every ten seconds or so, and
searches take anywhere from a couple of minutes to more than half an hour when
Galaxy is busy. When a job fails, `error` carries the end of the tool's stderr.

### Results

```sh
curl -H "X-API-Key: $KEY" "$BASE/jobs/$JOB_ID/results?limit=100&offset=0&sort=score"
```

While the job is still running, or its shards are still being merged, this
returns `202` with `Retry-After`. Keep polling it. Once the job is merged it
returns a page of up to 1,000 hits from the top 50,000, plus a summary:

- totals
- a per-index breakdown
- the organism and country cohort
- the export's size and row count

Each hit carries:

- `accession`
- `score`: k-mer coverage, FP-corrected
- `fp_correction`
- `shard`
- `sra`: organism, assay, platform, instrument, library layout, release
  date, country, BioProject, study and Mbases

### Export

```sh
curl -H "X-API-Key: $KEY" -o hits.tsv "$BASE/jobs/$JOB_ID/export?format=tsv"
```

The export holds every hit, not just the top 50,000. It is written the first
time the results are merged, so **read `/results` once before asking for it**.
Columns:

| Column                                                                                                                           | Meaning                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `accession`                                                                                                                      | SRA run                                                                  |
| `score`                                                                                                                          | k-mer coverage after FP correction (Logan's `kmer_coverage`)             |
| `ani`                                                                                                                            | `score ^ (1/31)`, Logan's `ANI_estimation`                               |
| `fp_correction`                                                                                                                  | The per-run correction subtracted from kmindex's ratio (empty when none) |
| `shard`                                                                                                                          | The index shard the hit came from                                        |
| `organism`, `assay_type`, `platform`, `instrument`, `library_layout`, `release_date`, `country`, `bioproject`, `study`, `mbases` | SRA run metadata                                                         |
| `latitude`, `longitude`                                                                                                          | Where the BioSample recorded them                                        |

The raw kmindex ratio is `score + fp_correction`, to four decimal places.
Hits whose ratio fell under the threshold after correction are not included.
We don't compute p-values or e-values: on Logan's own data they are
effectively zero for every hit.

Merged results are kept for an hour. Reading `/results` after that works,
but it merges the job all over again, which can take minutes for a search
across every index. So page through what you need, and take the export,
within the hour.

**Download exports promptly.** They are kept for about a day at most, and
sooner when disk is tight. After that `/export` returns `404` until a
`/results` call merges the job again.

## Errors

| Code      | Meaning                                                                              |
| --------- | ------------------------------------------------------------------------------------ |
| 202       | Not ready yet; retry after `Retry-After` seconds                                     |
| 400 / 422 | The request or job id is malformed, or the job failed (`/results`)                   |
| 401       | Missing or wrong API key                                                             |
| 404       | No such job, or no export for it right now                                           |
| 409       | `Idempotency-Key` conflict: different body, still in flight, or outcome unknown      |
| 410       | The API has passed its sunset date                                                   |
| 429       | Over a rate limit                                                                    |
| 502       | Galaxy failed underneath us; retry later                                             |
| 503       | Submissions paused, Galaxy unavailable, or the Idempotency-Key could not be recorded |

## Operating it (BRC side)

Configure it with these backend env vars:

| Variable                             | Default | Notes                                                                                                       |
| ------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------- |
| `PARTNER_API_ENABLED`                | `false` | Mounts the routes at all                                                                                    |
| `PARTNER_API_KEYS`                   | --      | `partner_id:key_id:sha256hex,...`; mint with `python -m scripts.generate_partner_key <partner_id> <key_id>` |
| `PARTNER_API_SUNSET`                 | --      | ISO date; required when enabled; 410 from then on                                                           |
| `PARTNER_SUBMIT_PAUSED`              | `false` | 503 on submit, everything else keeps answering                                                              |
| `PARTNER_SUBMIT_RATE_LIMIT_REQUESTS` | `20`    | Per partner per `SUBMIT_RATE_LIMIT_WINDOW`                                                                  |
| `PARTNER_RATE_LIMIT_REQUESTS`        | `300`   | Per partner per `RATE_LIMIT_WINDOW`                                                                         |

- **Galaxy.** Jobs run on the BRC service account, in a history called
  "BRC Logan Partner - <partner_id>".
- **Analytics.** Every submission, native or partner, lands in
  `kmindex_submissions` with `source` and `partner_id`.
- **Rotating a key.** Add the new entry alongside the old, hand over the new
  key, then remove the old entry.
- **Redis.** One all-index aggregate is about 4.5 MB. Partner aggregates are
  cached for an hour rather than a day, so a partner at its full submit
  budget holds about 90 MB. Even so, raise `maxmemory` above the 256 MB
  default before enabling this, or partner traffic will evict users' cached
  results and the rate-limit counters.
- **Idempotency and budgets live in the cache Redis.** Idempotency records
  and the partner rate-limit counters share the `allkeys-lru` Redis with the
  cached results, so they hold only while Redis isn't evicting. If Redis
  evicts an idempotency record, a retry can start a second search. If it
  evicts a counter, that window's budget resets. This is a deliberate
  tradeoff for a temporary API: Redis should never get full at the
  `maxmemory` above. Before enabling on a host, and while the API is live,
  check that `redis-cli INFO stats` shows `evicted_keys:0`. If evictions start,
  raise `maxmemory` or pause submits. Don't rely on these guarantees past
  that point.
