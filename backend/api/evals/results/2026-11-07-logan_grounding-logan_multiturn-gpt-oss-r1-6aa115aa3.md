# BRC Analytics evals

- Generated: 2026-11-07T14:51:37Z
- Commit: `6aa115aa3`
- Datasets: logan_grounding, logan_multiturn
- Models: gpt-oss-120b-tacc

## `logan_grounding`

| Model             | LLMJudge     | NumbersTraceToContext | \_DataSourceTopN | \_NoUnhedgedIdentityClaim | \_ReplyMentionsAny | \_ReplyMustMention | \_ReplyMustNotMatch | \_ReplyMustNotMention | n   | duration |
| ----------------- | ------------ | --------------------- | ---------------- | ------------------------- | ------------------ | ------------------ | ------------------- | --------------------- | --- | -------- |
| gpt-oss-120b-tacc | 6.0/6 (1.00) | 13.3/14 (0.95)        | 1.0/1 (1.00)     | 1.0/1 (1.00)              | 1.0/3 (0.33)       | 7.2/12 (0.60)      | 1.0/1 (1.00)        | 4.0/4 (1.00)          | 14  | 77.1s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                   | gpt-oss-120b-tacc |
| ---------------------- | ----------------- |
| big_study              | 0.50              |
| brc_organisms          | 0.50              |
| geography_all          | 0.82              |
| injection              | 1.00              |
| no_mirror              | 0.83              |
| platform_planning      | 0.92              |
| saturated              | 0.50              |
| score_meaning          | 0.83              |
| top_100                | 0.95              |
| truncated_leader       | 0.80              |
| unsupported_share      | 0.90              |
| what_is_this_cohort    | 1.00              |
| where_is_the_data_from | 0.99              |
| which_index            | 0.50              |

</details>

## `logan_multiturn`

| Model             | FinalSchemaContains | IsCompleteEquals | \_DataSourceAccessions | n   | duration |
| ----------------- | ------------------- | ---------------- | ---------------------- | --- | -------- |
| gpt-oss-120b-tacc | 1.0/1 (1.00)        | 1.0/1 (1.00)     | 1.0/1 (1.00)           | 1   | 17.4s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                     | gpt-oss-120b-tacc |
| ------------------------ | ----------------- |
| variant_calling_on_top_5 | 1.00              |

</details>
