# Logan eval fixtures

Each fixture is a `<name>.json` (a `LoganSnapshot` plus a `_fixture` key the
snapshot model ignores) and, for captured ones, a `<name>.parquet` (the job's
export). `scripts/capture_logan_fixture.py` writes both; its docstring says
what goes in `_fixture` and how the export is trimmed. `evals/logan_fixture.py`
loads them and serves them to the assistant through a Galaxy stand-in.

After capturing or deriving, run `npx prettier --write` on the JSON: the
repository's pre-commit check formats every JSON file.

| Id  | Name                    | Source                                                                                                                                                                                                      |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | `logan_pfal_18s`        | Captured from dev, job `806580fd1ed1cc90` (_P. falciparum_ 18S against GENOMIC_INV, 17,629 matches, not truncated). Export kept whole: 17,629 rows, 210 KB.                                                 |
| F2  | `logan_truncated_mixed` | Captured from dev, job `dee9dc267ca2a401` (`salmonella_invA` against GENOMIC_BCT, 560,854 matches, truncated at 50,000, 2,613 organisms). Export trimmed to 5,000 rows: top 1,000 plus a stratified sample. |
| F3  | `logan_saturated`       | Derived from F1 (`--derive saturated`): the last six of the top 25 become soil metagenomes with `fp_correction` 0.2 and lowered scores. Synthetic.                                                          |
| F4  | `logan_no_mirror`       | Derived from F1 (`--derive no_mirror`): no cohort, no geography, no hit metadata, `sra_mirror_available` false.                                                                                             |
| F5  | `logan_injected`        | Derived from F1 (`--derive injected`): instruction-shaped `query_name` and second top organism, both under the 80-character prompt cap.                                                                     |
| F6  | the two `.parquet`s     | Captured with F1 and F2.                                                                                                                                                                                    |

All captured 2026-11-07 from `https://dev.brc-analytics.org` (running main at
`d53633908`), minutes after the jobs' results were read, so the aggregate and
the export were current. No new searches were submitted: both jobs already
existed on dev.

## How the jobs were found

- F1 is the _P. falciparum_ 18S example job named in the phase-1 assistant
  work; it was still cached on dev.
- F2: no listing of past jobs is public, so candidate ids recorded in earlier
  Logan notes were probed with `GET .../results?limit=1`. `dee9dc267ca2a401`
  was the one truncated, mixed-organism job among them. Its trap is the same
  one the 1.1M-hit 16S job showed: the capped top hits are mostly
  _S. enterica_ serovar Typhimurium (13 of the top 25), while over the whole
  match set plain _Salmonella enterica_ leads at 57.3% and Typhimurium is 5.4%.

## Trimming, and why F1 is whole

F1's export is small enough to keep whole, and keeping it whole matters: a
count the query engine computes over the fixture parquet then agrees with the
cohort numbers the snapshot renders in the same prompt. A trimmed file would
answer "how many from Malawi?" with a sample count sitting next to the
cohort's 754. F2 had to be trimmed (560,854 rows), so counts over its parquet
are counts over the 5,000-row sample, not the job; cases that check a count
against ground truth use F1.

## What the public API does not expose

The results response names the indexes searched (`per_index`) but not the
threshold or the query length, so `_fixture.search.threshold` and
`query_bases` are `"unknown"` in every fixture.
