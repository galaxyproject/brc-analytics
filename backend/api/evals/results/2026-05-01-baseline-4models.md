# BRC Analytics evals

- Generated: 2026-05-01T13:35:17Z
- Commit: `575673ec`
- Datasets: assistant_multiturn, search_interpretation, tool_selection, workflow_recommendation
- Models: Llama-4-Maverick-17B-128E-Instruct, Meta-Llama-3.3-70B-Instruct, claude-sonnet-4-6, gpt-oss-120b

## `assistant_multiturn`

| Model                              | FinalSchemaContains | IsCompleteEquals | LLMJudge   | n   | duration |
| ---------------------------------- | ------------------- | ---------------- | ---------- | --- | -------- |
| Llama-4-Maverick-17B-128E-Instruct | 0/3 (0.00)          | 1/3 (0.33)       | 1/3 (0.33) | 3   | 27.8s    |
| Meta-Llama-3.3-70B-Instruct        | 0/3 (0.00)          | 0/3 (0.00)       | 0/3 (0.00) | 3   | 50.9s    |
| claude-sonnet-4-6                  | 0/3 (0.00)          | 2/3 (0.67)       | 2/3 (0.67) | 3   | 40.5s    |
| gpt-oss-120b                       | 0/3 (0.00)          | 3/3 (1.00)       | 3/3 (1.00) | 3   | 24.2s    |

<details><summary>Per-case detail</summary>

| Case                    | Llama-4-Maverick-17B-128E-Instruct   | Meta-Llama-3.3-70B-Instruct          | claude-sonnet-4-6                    | gpt-oss-120b |
| ----------------------- | ------------------------------------ | ------------------------------------ | ------------------------------------ | ------------ |
| exploration_only        | 0.00                                 | FAIL: ModelHTTPError: status_code: 4 | 0.00                                 | 0.00         |
| tb_variant_calling      | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | FAIL: ContentFilterError: Content fi | 0.00         |
| yeast_rnaseq_happy_path | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | 0.00                                 | 0.00         |
| exploration_only        | 0.00                                 | FAIL: ModelHTTPError: status_code: 4 | 0.00                                 | 0.00         |
| tb_variant_calling      | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | FAIL: ContentFilterError: Content fi | 0.00         |
| yeast_rnaseq_happy_path | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | 0.00                                 | 0.00         |

</details>

## `search_interpretation`

| Model                              | FieldEquals | FieldEquals_2 | LLMJudge    | n   | duration |
| ---------------------------------- | ----------- | ------------- | ----------- | --- | -------- |
| Llama-4-Maverick-17B-128E-Instruct | 9/10 (0.90) | 5/10 (0.50)   | 4/10 (0.40) | 10  | 13.8s    |
| Meta-Llama-3.3-70B-Instruct        | 9/10 (0.90) | 5/10 (0.50)   | 2/10 (0.20) | 10  | 9.3s     |
| claude-sonnet-4-6                  | 8/10 (0.80) | 5/10 (0.50)   | 4/10 (0.40) | 10  | 18.8s    |
| gpt-oss-120b                       | 9/10 (0.90) | 5/10 (0.50)   | 5/10 (0.50) | 10  | 15.3s    |

<details><summary>Per-case detail</summary>

| Case                          | Llama-4-Maverick-17B-128E-Instruct   | Meta-Llama-3.3-70B-Instruct          | claude-sonnet-4-6                    | gpt-oss-120b                         |
| ----------------------------- | ------------------------------------ | ------------------------------------ | ------------------------------------ | ------------------------------------ |
| atac_seq_chromatin            | 1.00                                 | 1.00                                 | 1.00                                 | 1.00                                 |
| candida_auris_drug_resistance | 1.00                                 | 1.00                                 | 1.00                                 | 1.00                                 |
| ecoli_illumina                | 1.00                                 | 1.00                                 | 1.00                                 | 1.00                                 |
| malaria_wgs                   | 1.00                                 | 1.00                                 | 1.00                                 | 1.00                                 |
| nanopore_pacbio_long_reads    | 1.00                                 | 1.00                                 | 1.00                                 | 1.00                                 |
| tb_chipseq                    | 1.00                                 | 1.00                                 | 1.00                                 | 1.00                                 |
| tb_variant_calling_intent     | 1.00                                 | 1.00                                 | FAIL: RuntimeError: LLM interpretati | 1.00                                 |
| yeast_common_name             | 1.00                                 | 1.00                                 | 1.00                                 | 1.00                                 |
| yeast_rnaseq_2023             | 1.00                                 | 1.00                                 | 1.00                                 | 1.00                                 |
| gibberish                     | FAIL: RuntimeError: Invalid query: T | FAIL: RuntimeError: Invalid query: T | FAIL: RuntimeError: Invalid query: T | FAIL: RuntimeError: Invalid query: T |
| tb_variant_calling_intent     | 1.00                                 | 1.00                                 | FAIL: RuntimeError: LLM interpretati | 1.00                                 |

</details>

## `tool_selection`

| Model                              | ToolCallMatch | \_NoToolCalls | \_ReplyMustMention | n   | duration |
| ---------------------------------- | ------------- | ------------- | ------------------ | --- | -------- |
| Llama-4-Maverick-17B-128E-Instruct | 3/8 (0.38)    | 1/8 (0.12)    | 1/8 (0.12)         | 8   | 38.6s    |
| Meta-Llama-3.3-70B-Instruct        | 2/8 (0.25)    | 1/8 (0.12)    | 0/8 (0.00)         | 8   | 364.0s   |
| claude-sonnet-4-6                  | 7/8 (0.88)    | 1/8 (0.12)    | 2/8 (0.25)         | 8   | 13.7s    |
| gpt-oss-120b                       | 6/8 (0.75)    | 1/8 (0.12)    | 2/8 (0.25)         | 8   | 8.2s     |

<details><summary>Per-case detail</summary>

| Case                          | Llama-4-Maverick-17B-128E-Instruct   | Meta-Llama-3.3-70B-Instruct          | claude-sonnet-4-6 | gpt-oss-120b |
| ----------------------------- | ------------------------------------ | ------------------------------------ | ----------------- | ------------ |
| assembly_details              | FAIL: ModelHTTPError: status_code: 4 | 1.00                                 | 1.00              | 1.00         |
| compatibility_check           | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | 1.00              | 1.00         |
| compatible_workflows_haploid  | 1.00                                 | FAIL: RuntimeError: Assistant reques | 1.00              | 1.00         |
| list_workflow_categories      | 1.00                                 | 1.00                                 | 1.00              | 0.00         |
| list_yeast_assemblies         | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | 1.00              | 1.00         |
| lookup_tb_assemblies_by_taxid | 1.00                                 | FAIL: ModelHTTPError: status_code: 4 | 1.00              | 1.00         |
| off_topic_redirect            | 0.00                                 | 0.00                                 | 0.00              | 0.00         |
| transcriptomics_workflows     | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | 1.00              | 1.00         |
| assembly_details              | FAIL: ModelHTTPError: status_code: 4 | 1.00                                 | 1.00              | 1.00         |
| compatibility_check           | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | 1.00              | 1.00         |
| compatible_workflows_haploid  | 1.00                                 | FAIL: RuntimeError: Assistant reques | 1.00              | 1.00         |
| list_yeast_assemblies         | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | 1.00              | 1.00         |
| lookup_tb_assemblies_by_taxid | 1.00                                 | FAIL: ModelHTTPError: status_code: 4 | 1.00              | 1.00         |
| transcriptomics_workflows     | FAIL: ModelHTTPError: status_code: 4 | FAIL: ModelHTTPError: status_code: 4 | 1.00              | 1.00         |

</details>

## `workflow_recommendation`

| Model                              | IwcIdInSet | LLMJudge   | n   | duration |
| ---------------------------------- | ---------- | ---------- | --- | -------- |
| Llama-4-Maverick-17B-128E-Instruct | 0/3 (0.00) | 3/3 (1.00) | 3   | 10.7s    |
| Meta-Llama-3.3-70B-Instruct        | 0/3 (0.00) | 2/3 (0.67) | 3   | 12.4s    |
| claude-sonnet-4-6                  | 0/3 (0.00) | 2/3 (0.67) | 3   | 21.0s    |
| gpt-oss-120b                       | 0/3 (0.00) | 3/3 (1.00) | 3   | 13.8s    |

<details><summary>Per-case detail</summary>

| Case               | Llama-4-Maverick-17B-128E-Instruct | Meta-Llama-3.3-70B-Instruct | claude-sonnet-4-6 | gpt-oss-120b |
| ------------------ | ---------------------------------- | --------------------------- | ----------------- | ------------ |
| consensus_assembly | 0.00                               | 0.00                        | 0.00              | 0.00         |
| tb_variant_calling | 0.00                               | 0.00                        | 0.00              | 0.00         |
| yeast_rnaseq       | 0.00                               | 0.00                        | 0.00              | 0.00         |

</details>
