# BRC Analytics evals

The tables below are the runner's own, from scorers that were later
tightened; the scores to use are in `2026-11-07-logan-narrowing-ab.md`.

- Generated: 2026-11-07T16:27:53Z
- Commit: `26cf02678`
- Datasets: logan_narrowing
- Models: MiniMax-M2.7

## `logan_narrowing`

| Model        | LoganQueryShape | NumbersTraceToContext | \_ReplyHasCount | n   | duration |
| ------------ | --------------- | --------------------- | --------------- | --- | -------- |
| MiniMax-M2.7 | 10.0/19 (0.53)  | 9.4/19 (0.50)         | 10.0/19 (0.53)  | 19  | 3195.6s  |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                        | MiniMax-M2.7                         |
| --------------------------- | ------------------------------------ |
| count_country_instrument    | 1.00                                 |
| count_organism_year         | 1.00                                 |
| count_platform_year         | 1.00                                 |
| count_score                 | 0.92                                 |
| empty_result                | FAIL: AssistantTimeoutError: Assista |
| explicit_clear              | 1.00                                 |
| follow_up_narrows_selection | 0.89                                 |
| misspelt_value              | FAIL: AssistantTimeoutError: Assista |
| question_is_not_a_selection | FAIL: AssistantTimeoutError: Assista |
| select_country              | 1.00                                 |

</details>
