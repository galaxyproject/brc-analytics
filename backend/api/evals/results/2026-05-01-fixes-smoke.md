# BRC Analytics evals

- Generated: 2026-05-01T14:34:52Z
- Commit: `a55f2c3b`
- Datasets: assistant_multiturn, search_interpretation
- Models: claude-sonnet-4-6

## `assistant_multiturn`

| Model             | IsCompleteEquals | LLMJudge   | n   | duration |
| ----------------- | ---------------- | ---------- | --- | -------- |
| claude-sonnet-4-6 | 1/1 (1.00)       | 1/1 (1.00) | 1   | 21.5s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case             | claude-sonnet-4-6 |
| ---------------- | ----------------- |
| exploration_only | 1.00              |

</details>

## `search_interpretation`

| Model             | LLMJudge   | LowConfidence | n   | duration |
| ----------------- | ---------- | ------------- | --- | -------- |
| claude-sonnet-4-6 | 1/1 (1.00) | 1/1 (1.00)    | 1   | 9.9s     |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case      | claude-sonnet-4-6 |
| --------- | ----------------- |
| gibberish | 1.00              |

</details>
