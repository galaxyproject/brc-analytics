# BRC Analytics evals

The tables below are the runner's own, from scorers that were later
tightened; the scores to use are in `2026-11-07-logan-narrowing-ab.md`.

- Generated: 2026-11-07T18:13:46Z
- Commit: `b7e5793cd`
- Datasets: logan_narrowing
- Models: MiniMax-M2.7

## `logan_narrowing`

| Model        | LoganQueryShape | NumbersTraceToContext | \_ReplyHasCount | \_SelectionHas | n   | duration |
| ------------ | --------------- | --------------------- | --------------- | -------------- | --- | -------- |
| MiniMax-M2.7 | 6.4/10 (0.64)   | 9.8/10 (0.98)         | 6.6/10 (0.66)   | 3.2/4 (0.80)   | 10  | 2510.1s  |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                        | MiniMax-M2.7 |
| --------------------------- | ------------ |
| count_country_instrument    | 0.73         |
| count_organism_year         | 0.47         |
| count_platform_year         | 1.00         |
| count_score                 | 1.00         |
| empty_result                | 0.87         |
| explicit_clear              | 0.51         |
| follow_up_narrows_selection | 0.40         |
| misspelt_value              | 0.87         |
| question_is_not_a_selection | 1.00         |
| select_country              | 0.90         |

</details>
