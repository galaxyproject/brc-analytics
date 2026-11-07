# BRC Analytics evals

- Generated: 2026-11-07T16:27:29Z
- Commit: `26cf02678`
- Datasets: logan_narrowing
- Models: MiniMax-M2.7

## `logan_narrowing`

| Model        | LoganQueryShape | NumbersTraceToContext | \_ReplyHasCount | \_SelectionHas | n   | duration |
| ------------ | --------------- | --------------------- | --------------- | -------------- | --- | -------- |
| MiniMax-M2.7 | 5.6/14 (0.40)   | 9.7/14 (0.69)         | 6.6/14 (0.47)   | 2.0/5 (0.40)   | 14  | 3170.7s  |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                        | MiniMax-M2.7                         |
| --------------------------- | ------------------------------------ |
| count_country_instrument    | 0.47                                 |
| count_organism_year         | 0.60                                 |
| count_platform_year         | 1.00                                 |
| count_score                 | 1.00                                 |
| empty_result                | FAIL: AssistantTimeoutError: Assista |
| explicit_clear              | 0.66                                 |
| follow_up_narrows_selection | 1.00                                 |
| misspelt_value              | 0.73                                 |
| question_is_not_a_selection | FAIL: AssistantTimeoutError: Assista |
| select_country              | 1.00                                 |

</details>
