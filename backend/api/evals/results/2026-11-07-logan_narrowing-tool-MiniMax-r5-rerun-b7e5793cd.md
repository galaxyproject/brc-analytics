# BRC Analytics evals

The tables below are the runner's own, from scorers that were later
tightened; the scores to use are in `2026-11-07-logan-narrowing-ab.md`.

- Generated: 2026-11-07T17:31:06Z
- Commit: `b7e5793cd`
- Datasets: logan_narrowing
- Models: MiniMax-M2.7

## `logan_narrowing`

| Model        | LoganQueryShape | NumbersTraceToContext | \_ReplyHasCount | n   | duration |
| ------------ | --------------- | --------------------- | --------------- | --- | -------- |
| MiniMax-M2.7 | 9.0/10 (0.90)   | 9.8/10 (0.97)         | 10.0/10 (1.00)  | 10  | 509.4s   |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                        | MiniMax-M2.7 |
| --------------------------- | ------------ |
| count_country_instrument    | 1.00         |
| count_organism_year         | 1.00         |
| count_platform_year         | 1.00         |
| count_score                 | 0.92         |
| empty_result                | 0.67         |
| explicit_clear              | 1.00         |
| follow_up_narrows_selection | 1.00         |
| misspelt_value              | 1.00         |
| question_is_not_a_selection | 1.00         |
| select_country              | 1.00         |

</details>
