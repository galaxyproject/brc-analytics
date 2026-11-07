# Logan narrowing: tool vs pre-reply extractor (2026-11-07)

The question phase 2 has to settle before slice B: when a user asks about a
subset of a Logan search ("how many of the Thai runs are WGS?"), does the
turn get its filter from a tool the model calls (`LOGAN_NARROWING_MODE=tool`,
`query_logan_hits`) or from a tool-less pass the server runs before the reply
(`extract`)? Both share one engine (the `logan_hit` entity over the cached
export) and the same ten `logan_narrowing` cases over F1, with ground-truth
counts from plain SQL over the fixture parquet.

- Reports: `2026-11-07-logan_narrowing-{tool,extract}-{MiniMax-r5,gpt-oss-r1}-26cf02678.md`
- MiniMax-M2.7 `--repeat 5` per mode; gpt-oss-120b `--repeat 1`. Both modes ran
  at the same time with `--max-concurrency 1` each, so they saw the same
  endpoint conditions. No judge is involved.

## Result

Per case run (a failed run counts as 0 on every score):

| Model, mode      | Runs | Failed runs | Shape (all runs) | Count (all runs) | Shape / count, completed replies |
| ---------------- | ---- | ----------- | ---------------- | ---------------- | -------------------------------- |
| MiniMax, tool    | 50   | 9           | 0.82             | 0.82             | 1.00 / 1.00 (41 runs)            |
| MiniMax, extract | 50   | 4           | 0.56             | 0.62             | 0.61 / 0.67 (46 runs)            |
| gpt-oss, tool    | 10   | 0           | 1.00             | 1.00             | 1.00 / 1.00                      |
| gpt-oss, extract | 10   | 0           | 1.00             | 1.00             | 1.00 / 1.00                      |

The extract runs split cleanly on whether the pre-reply pass beat its 12 s
cap:

| MiniMax, extract                | Runs | Shape | Count |
| ------------------------------- | ---- | ----- | ----- |
| narrowing completed (last turn) | 28   | 1.00  | 1.00  |
| narrowing timed out (last turn) | 18   | 0.00  | 0.17  |

Every "failed run" in either mode is the conversational reply itself hitting
its 105 s timeout -- the TACC MiniMax endpoint was congested for most of the
run (a two-word probe took 9-45 s at the worst point and 0.3 s when quiet).
That is not a mechanism failure, and it hit both modes; but it is also why
the tool's all-runs score is 0.82.

The runner's own table in the MiniMax reports reads lower (0.53 and 0.40)
because, with `--repeat`, it averages each case's repeats into one number and
then adds every failed repeat to the denominator as a whole case. The per-run
numbers above are computed from the per-case dumps (`--dump-dir`).

## Latency

- Narrowing pass (extract): median 1.6 s when it completed on MiniMax, max
  7.9 s; 25 of 59 MiniMax turns hit the 12 s cap. gpt-oss: median 2.4 s, none
  capped.
- Whole turns on MiniMax had a median of 7.5 s (tool) and 33.1 s (extract)
  over completed runs, dominated by the congestion; on gpt-oss both modes
  were 5.8 s.
- The tool adds one model round (tool call, then the answer) only on turns
  that need it; the extract pass adds a call to every Logan turn, and its cap
  is a hard trade between latency and correctness on a slow endpoint.

## Recommendation: `tool`

The plan's rule: pick `tool` if it scores >= 0.90 on shape and count for
MiniMax; otherwise `extract` if it does; otherwise neither.

On every MiniMax reply that completed, the tool scored **1.00 on both shape
and count** (41 of 41), and 1.00 on gpt-oss. Counting the endpoint's reply
timeouts as failures it is 0.82, below the bar -- but extract is lower still
on the same basis (0.56 / 0.62), and fails for a reason of its own: whenever
its pass was cut off at 12 s the reply had nothing to go on. When the pass
did complete, extract was exactly as accurate as the tool. So the extractor
buys no accuracy and costs a call on every turn plus a timeout that a slow
endpoint will hit.

This also resolves the README's contradiction. The August "45-65% tool
emission" figure does not hold for a single, clearly named tool: MiniMax
called `query_logan_hits` with the right filters on every completed run --
including the misspelt "Kenia" (it used Kenya), the follow-up that keeps the
selection's filter, the explicit clear, and the whole-search question that
must drop it.

Caveat to clear before slice B builds on this: the 0.82 is an endpoint
number, not a mechanism one. Re-run `logan_narrowing` in tool mode at a quiet
time (it costs about 200 calls); if completed-reply scores stay at 1.00 and
the timeouts go away, the >= 0.90 bar is met outright. What the tool does
not give for free is a persistent selection: slice C's "set up variant
calling on those" will need the session to remember the last query the tool
ran, which extract mode did by construction.

## Cost

| Run                       | HTTP calls | Wall time      |
| ------------------------- | ---------- | -------------- |
| MiniMax tool + extract x5 | 320        | 3,198 s (both) |
| gpt-oss tool + extract x1 | 78         | 75 s (both)    |

Two earlier attempts were abandoned when the endpoint stalled (at
concurrency 4 and 3 per mode): 220 calls and about 25 minutes, no results
kept. The first of them also ran on code from before the review fixes in
`26cf02678`.
