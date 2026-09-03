# BRC Analytics evals

- Generated: 2026-08-29T02:57:25Z
- Commit: `57767eca`
- Datasets: logan_grounding, logan_multiturn
- Models: MiniMax-M2.7, gpt-oss-120b-tacc

## `logan_grounding`

| Model             | LLMJudge     | \_ReplyMustMention | \_ReplyMustNotMention | n   | duration |
| ----------------- | ------------ | ------------------ | --------------------- | --- | -------- |
| MiniMax-M2.7      | 3.0/3 (1.00) | 3.0/3 (1.00)       | 1.0/1 (1.00)          | 3   | 14.0s    |
| gpt-oss-120b-tacc | 2.0/3 (0.67) | 3.0/3 (1.00)       | 1.0/1 (1.00)          | 3   | 13.5s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                   | MiniMax-M2.7 | gpt-oss-120b-tacc |
| ---------------------- | ------------ | ----------------- |
| platform_planning      | 1.00         | 1.00              |
| what_is_this_cohort    | 1.00         | 1.00              |
| where_is_the_data_from | 1.00         | 0.67              |

</details>

## `logan_multiturn`

| Model             | FinalSchemaContains | IsCompleteEquals | \_DataSourceAccessions | n   | duration |
| ----------------- | ------------------- | ---------------- | ---------------------- | --- | -------- |
| MiniMax-M2.7      | 1.0/1 (1.00)        | 1.0/1 (1.00)     | 1.0/1 (1.00)           | 1   | 13.8s    |
| gpt-oss-120b-tacc | 1.0/1 (1.00)        | 1.0/1 (1.00)     | 1.0/1 (1.00)           | 1   | 12.5s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                     | MiniMax-M2.7 | gpt-oss-120b-tacc |
| ------------------------ | ------------ | ----------------- |
| variant_calling_on_top_5 | 1.00         | 1.00              |

</details>
