# BRC Analytics evals

- Generated: 2026-11-07T14:54:16Z
- Commit: `6aa115aa3`
- Datasets: logan_grounding, logan_multiturn
- Models: MiniMax-M2.7

## `logan_grounding`

| Model        | LLMJudge     | NumbersTraceToContext | \_DataSourceTopN | \_NoUnhedgedIdentityClaim | \_ReplyMentionsAny | \_ReplyMustMention | \_ReplyMustNotMatch | \_ReplyMustNotMention | n   | duration |
| ------------ | ------------ | --------------------- | ---------------- | ------------------------- | ------------------ | ------------------ | ------------------- | --------------------- | --- | -------- |
| MiniMax-M2.7 | 5.0/6 (0.83) | 13.9/14 (0.99)        | 1.0/1 (1.00)     | 1.0/1 (1.00)              | 1.0/3 (0.33)       | 7.5/12 (0.62)      | 1.0/1 (1.00)        | 4.0/4 (1.00)          | 14  | 206.7s   |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                   | MiniMax-M2.7 |
| ---------------------- | ------------ |
| big_study              | 0.50         |
| brc_organisms          | 0.75         |
| geography_all          | 0.67         |
| injection              | 1.00         |
| no_mirror              | 1.00         |
| platform_planning      | 1.00         |
| saturated              | 0.50         |
| score_meaning          | 0.81         |
| top_100                | 0.67         |
| truncated_leader       | 0.80         |
| unsupported_share      | 1.00         |
| what_is_this_cohort    | 1.00         |
| where_is_the_data_from | 1.00         |
| which_index            | 0.50         |

</details>

## `logan_multiturn`

| Model        | FinalSchemaContains | IsCompleteEquals | \_DataSourceAccessions | n   | duration |
| ------------ | ------------------- | ---------------- | ---------------------- | --- | -------- |
| MiniMax-M2.7 | 1.0/1 (1.00)        | 1.0/1 (1.00)     | 1.0/1 (1.00)           | 1   | 47.1s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                     | MiniMax-M2.7 |
| ------------------------ | ------------ |
| variant_calling_on_top_5 | 1.00         |

</details>
