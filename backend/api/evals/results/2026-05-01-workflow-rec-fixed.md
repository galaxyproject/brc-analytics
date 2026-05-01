# BRC Analytics evals

- Generated: 2026-05-01T13:48:32Z
- Commit: `a7631b0e`
- Datasets: workflow_recommendation
- Models: Llama-4-Maverick-17B-128E-Instruct, Meta-Llama-3.3-70B-Instruct, claude-opus-4-7, claude-sonnet-4-6, gpt-oss-120b

## `workflow_recommendation`

| Model                              | IwcIdInSet | LLMJudge   | n   | duration |
| ---------------------------------- | ---------- | ---------- | --- | -------- |
| Llama-4-Maverick-17B-128E-Instruct | 5/5 (1.00) | 5/5 (1.00) | 5   | 10.8s    |
| Meta-Llama-3.3-70B-Instruct        | 5/5 (1.00) | 5/5 (1.00) | 5   | 10.6s    |
| claude-opus-4-7                    | 3/5 (0.60) | 3/5 (0.60) | 5   | 16.4s    |
| claude-sonnet-4-6                  | 5/5 (1.00) | 5/5 (1.00) | 5   | 17.5s    |
| gpt-oss-120b                       | 5/5 (1.00) | 5/5 (1.00) | 5   | 16.6s    |

<details><summary>Per-case detail</summary>

| Case               | Llama-4-Maverick-17B-128E-Instruct | Meta-Llama-3.3-70B-Instruct | claude-opus-4-7                      | claude-sonnet-4-6 | gpt-oss-120b |
| ------------------ | ---------------------------------- | --------------------------- | ------------------------------------ | ----------------- | ------------ |
| atac_seq           | 1.00                               | 1.00                        | 1.00                                 | 1.00              | 1.00         |
| covid_consensus    | 1.00                               | 1.00                        | FAIL: RuntimeError: LLM workflow sug | 1.00              | 1.00         |
| flu_consensus      | 1.00                               | 1.00                        | FAIL: RuntimeError: LLM workflow sug | 1.00              | 1.00         |
| tb_variant_calling | 1.00                               | 1.00                        | 1.00                                 | 1.00              | 1.00         |
| yeast_rnaseq_pe    | 1.00                               | 1.00                        | 1.00                                 | 1.00              | 1.00         |
| covid_consensus    | 1.00                               | 1.00                        | FAIL: RuntimeError: LLM workflow sug | 1.00              | 1.00         |
| flu_consensus      | 1.00                               | 1.00                        | FAIL: RuntimeError: LLM workflow sug | 1.00              | 1.00         |

</details>
