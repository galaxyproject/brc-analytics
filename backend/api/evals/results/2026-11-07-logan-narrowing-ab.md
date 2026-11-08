# Logan narrowing: tool vs pre-reply extractor (2026-11-07)

The question to settle before building chat narrowing into Logan sessions:
when a user asks about a subset of a Logan search ("how many of the Thai runs are WGS?"), does the
turn get its filter from a tool the model calls (`LOGAN_NARROWING_MODE=tool`,
`query_logan_hits`) or from a tool-less pass the server runs before the reply
(`extract`)? Both share one engine (the `logan_hit` entity over the cached
export) and the same ten `logan_narrowing` cases over F1, with ground-truth
counts from plain SQL over the fixture parquet. No judge is involved.

**Answer: `tool`.** On a re-run with a quiet endpoint it cleared the bar over
**all** runs: MiniMax-M2.7 scored **0.90 shape / 1.00 count over 50 of 50
runs**, with no failed runs. Extract was exactly as accurate whenever its
pre-reply pass finished, and wrong whenever its 12 s cap cut the pass off --
which on TACC it did on about a third of turns in both of its runs.

The extract arm was removed after this result: `LOGAN_NARROWING_MODE` is now
`off` (the default) or `tool`, and any other value reads as `off`. This page
and its per-run reports stay as the record of why. The extract rows below are
as they were scored at the time; the scorers that read its pass and its stored
selection went with it.

## Scoring

The first version of these scorers accepted wrong answers (a review found
them): a "before 1990" filter passed for "after 2019", extra filters passed,
and any number anywhere in the reply passed as the count. They now require:

- **Shape:** the last query that answered the last turn has exactly the
  expected filters. That is its last `query_logan_hits` call whose own return
  holds a count (a call that errored, found no cached export or failed
  validation is skipped); for extract it was the pass's query when the pass
  counted and applied it (not when it timed out, errored or stopped on a value
  it couldn't resolve). A turn with neither scores 0. Nothing missing, nothing
  extra. `eq x` and `in [x]` agree, as do `gt 2019` and `gte 2020` on
  whole-number fields.
- **Count:** the reply states the ground-truth count as a run total ("181
  runs", "181 of the 231", "181 are WGS"), and states no other total except
  the search's, a selection's, or a count the model's context holds -- the
  first two only as the group the answer is drawn from ("of the 17,629"),
  never as the matching count itself ("actually 999 matching runs" fails even
  when 999 is the search's total). A number the user said may be repeated, and
  when it stands before the verb ("released after 2019 are 42") the claim is
  the number after it. For zero, "no ... runs" counts, but only without a
  contradicting total.
- **Selection** (extract only): the stored selection's filters are exactly
  the expected ones.

Every number below is from the per-case `--dump-dir` dumps, re-scored with
those scorers; a failed run counts 0 on every score. A second review pass
tightened the shape and count rules as described above; re-scoring every
dump with that version changed no score, and neither did a third (the user's
number before a verb, a total that ends a sentence): the tool rows were
re-scored with it and every cell is as shown. The dumps predate per-call return
pairing, so their calls are paired with returns by position, which holds
because `query_logan_hits` was the only tool any of these turns called (every
turn has as many returns as calls). The runner's own tables
in the reports are the old scorers' and, under `--repeat`, also mis-weight
failures (each failed repeat counts as a whole case).

## Results

| Run                                  | Model, mode      | Runs | Failed | Shape (all) | Count (all) | Shape / count, completed |
| ------------------------------------ | ---------------- | ---- | ------ | ----------- | ----------- | ------------------------ |
| re-run, quiet endpoint (`b7e5793cd`) | MiniMax, tool    | 50   | 0      | **0.90**    | **1.00**    | 0.90 / 1.00              |
| re-run, congested (`b7e5793cd`)      | MiniMax, extract | 50   | 0      | 0.64        | 0.66        | 0.64 / 0.66              |
| first run, congested (`26cf02678`)   | MiniMax, tool    | 50   | 9      | 0.72        | 0.82        | 0.88 / 1.00              |
| first run, congested (`26cf02678`)   | MiniMax, extract | 50   | 4      | 0.56        | 0.56        | 0.61 / 0.61              |
| first run (`26cf02678`)              | gpt-oss, tool    | 10   | 0      | 1.00        | 1.00        | 1.00 / 1.00              |
| first run (`26cf02678`)              | gpt-oss, extract | 10   | 0      | 1.00        | 1.00        | 1.00 / 1.00              |

Extract, split by whether the last turn's narrowing pass finished:

| Run       | Narrowing completed: runs, shape / count | Timed out at 12 s: runs, shape / count |
| --------- | ---------------------------------------- | -------------------------------------- |
| re-run    | 32, 1.00 / 1.00                          | 18, 0.00 / 0.06                        |
| first run | 28, 1.00 / 1.00                          | 18, 0.00 / 0.17                        |

What keeps the tool's shape at 0.90 rather than 1.00:

- **Re-run.** All five `empty_result` runs made the right count query
  (Mozambique AND WGA, 0) and then a second, breakdown query (Mozambique by
  assay type) to explain the zero. The rule scores the last query, so these
  fail on shape. Their replies were correct ("0 WGA runs from Mozambique; all
  460 are WGS").
- **First run.** All five `count_country_instrument` runs added
  `platform=ILLUMINA` beside `instrument=Illumina NovaSeq 6000`. That filter
  is redundant -- the count is unchanged -- but it is extra, so it fails.

The first run's 9 tool failures were the conversational reply hitting its
105 s timeout while TACC's MiniMax endpoint was congested; the re-run, on a
quiet endpoint, had none. The extract re-run met congestion again (24 of 65
narrowing passes timed out). The two arms of the re-run ran one after the
other, not side by side, so they did not see identical conditions; the
narrowing pass's own latency when it completed (median 1.4 s, max 2.3 s) is
what to compare, and the cap is what fails it.

## Latency

- Narrowing pass (extract), when it completed: median 1.4 s (re-run) and
  1.6 s (first run), max 7.9 s. Timed out: 24 of 65 turns (re-run), 25 of 59
  (first run).
- Whole MiniMax turns, median: tool 3.5 s on the quiet re-run (7.5 s in the
  first, congested run); extract 41.9 s and 33.1 s, both congested.
- gpt-oss: 5.8 s per turn in both modes; narrowing median 2.4 s, none capped.

## Recommendation: `tool`

The plan's rule: pick `tool` if it scores >= 0.90 on shape and count for
MiniMax; otherwise `extract` if it does; otherwise neither.

**Tool clears >= 0.90 over all runs on the quiet re-run: 0.90 shape, 1.00
count, 50 of 50 runs completed** (unchanged under the tightened scorers). It meets the shape bar exactly, and the
five misses are a correct query followed by an explanatory one. On the
earlier congested run it did not (0.72 / 0.82 over all runs, 9 runs lost to
reply timeouts). Extract never cleared it (0.56-0.64 shape) and fails for a
reason of its own: a pass cut off by its 12 s cap leaves the reply with
nothing to go on. When the pass did finish it was exactly as accurate as the
tool, so it buys no accuracy for a call on every Logan turn.

The August "45-65% tool emission" figure does not hold for one clearly named
tool. MiniMax called `query_logan_hits` on every run that completed, in both
tool runs, including the misspelt "Kenia" (it used Kenya), the follow-up that
keeps the selection, the explicit clear and the whole-search question.

For handing a subset to a workflow next: the tool keeps no selection. "Set up
variant calling on those" needs the session to remember the last query the
tool ran, which extract did by construction.

## Cost

| Run                                   | HTTP calls | Wall time      |
| ------------------------------------- | ---------- | -------------- |
| first run, MiniMax tool + extract x5  | 320        | 3,198 s (both) |
| first run, gpt-oss tool + extract x1  | 78         | 75 s (both)    |
| re-run, MiniMax tool x5               | 199        | 512 s          |
| re-run, MiniMax extract x5            | 170        | 2,512 s        |
| abandoned attempts (endpoint stalled) | 220        | about 25 min   |

To run the A/B's tool arm again, with each run's dump named for its mode:

```bash
cd backend/api
LOGAN_NARROWING_MODE=tool python -m evals.run_evals --datasets logan_narrowing \
  --models MiniMax-M2.7 --repeat 5 --max-concurrency 6 \
  --dump-dir /tmp/narrowing --label tool
```
