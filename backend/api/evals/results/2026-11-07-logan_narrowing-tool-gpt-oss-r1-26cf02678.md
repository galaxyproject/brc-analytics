# BRC Analytics evals

The tables below are the runner's own, from scorers that were later
tightened; the scores to use are in `2026-11-07-logan-narrowing-ab.md`.

- Generated: 2026-11-07T16:29:08Z
- Commit: `26cf02678`
- Datasets: logan_narrowing
- Models: gpt-oss-120b-tacc

## `logan_narrowing`

| Model             | LoganQueryShape | NumbersTraceToContext | \_ReplyHasCount | n   | duration |
| ----------------- | --------------- | --------------------- | --------------- | --- | -------- |
| gpt-oss-120b-tacc | 10.0/10 (1.00)  | 9.8/10 (0.98)         | 10.0/10 (1.00)  | 10  | 73.0s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                        | gpt-oss-120b-tacc |
| --------------------------- | ----------------- |
| count_country_instrument    | 1.00              |
| count_organism_year         | 1.00              |
| count_platform_year         | 1.00              |
| count_score                 | 1.00              |
| empty_result                | 1.00              |
| explicit_clear              | 1.00              |
| follow_up_narrows_selection | 1.00              |
| misspelt_value              | 1.00              |
| question_is_not_a_selection | 1.00              |
| select_country              | 0.94              |

</details>
