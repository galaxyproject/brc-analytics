# BRC Analytics evals

- Generated: 2026-05-01T14:18:30Z
- Commit: `66bbc609`
- Datasets: assistant_multiturn, search_interpretation, tool_selection, workflow_recommendation
- Models: claude-sonnet-4-6, gpt-oss-120b

## `assistant_multiturn`

| Model             | FinalSchemaContains | IsCompleteEquals | LLMJudge   | n   | duration |
| ----------------- | ------------------- | ---------------- | ---------- | --- | -------- |
| claude-sonnet-4-6 | 0/3 (0.00)          | 2/3 (0.67)       | 2/3 (0.67) | 3   | 25.0s    |
| gpt-oss-120b      | 0/3 (0.00)          | 3/3 (1.00)       | 3/3 (1.00) | 3   | 18.4s    |

<details><summary>Per-case detail</summary>

| Case                    | claude-sonnet-4-6                    | gpt-oss-120b |
| ----------------------- | ------------------------------------ | ------------ |
| exploration_only        | 0.00                                 | 0.00         |
| tb_variant_calling      | FAIL: ContentFilterError: Content fi | 0.00         |
| yeast_rnaseq_happy_path | 0.00                                 | 0.00         |
| tb_variant_calling      | FAIL: ContentFilterError: Content fi | 0.00         |

</details>

## `search_interpretation`

| Model             | FieldEquals | FieldEquals_2 | LLMJudge    | n   | duration |
| ----------------- | ----------- | ------------- | ----------- | --- | -------- |
| claude-sonnet-4-6 | 7/10 (0.70) | 5/10 (0.50)   | 8/10 (0.80) | 10  | 18.0s    |
| gpt-oss-120b      | 8/10 (0.80) | 5/10 (0.50)   | 9/10 (0.90) | 10  | 15.4s    |

<details><summary>Per-case detail</summary>

| Case                          | claude-sonnet-4-6                    | gpt-oss-120b                         |
| ----------------------------- | ------------------------------------ | ------------------------------------ |
| atac_seq_chromatin            | 0.00                                 | 0.00                                 |
| candida_auris_drug_resistance | 1.00                                 | 1.00                                 |
| ecoli_illumina                | 1.00                                 | 1.00                                 |
| gibberish                     | 0.00                                 | FAIL: RuntimeError: Invalid query: T |
| malaria_wgs                   | 1.00                                 | 1.00                                 |
| nanopore_pacbio_long_reads    | 1.00                                 | 1.00                                 |
| tb_chipseq                    | 1.00                                 | 1.00                                 |
| tb_variant_calling_intent     | FAIL: RuntimeError: LLM interpretati | 1.00                                 |
| yeast_common_name             | 1.00                                 | 1.00                                 |
| yeast_rnaseq_2023             | 1.00                                 | 1.00                                 |
| gibberish                     | 0.00                                 | FAIL: RuntimeError: Invalid query: T |
| tb_variant_calling_intent     | FAIL: RuntimeError: LLM interpretati | 1.00                                 |

</details>

## `tool_selection`

| Model             | ToolCallMatch | \_NoToolCalls | \_ReplyMustMention | n   | duration |
| ----------------- | ------------- | ------------- | ------------------ | --- | -------- |
| claude-sonnet-4-6 | 7/8 (0.88)    | 1/8 (0.12)    | 2/8 (0.25)         | 8   | 14.6s    |
| gpt-oss-120b      | 6/8 (0.75)    | 1/8 (0.12)    | 2/8 (0.19)         | 8   | 8.5s     |

<details><summary>Per-case detail</summary>

| Case                          | claude-sonnet-4-6 | gpt-oss-120b |
| ----------------------------- | ----------------- | ------------ |
| assembly_details              | 1.00              | 1.00         |
| compatibility_check           | 1.00              | 1.00         |
| compatible_workflows_haploid  | 1.00              | 1.00         |
| list_workflow_categories      | 1.00              | 0.00         |
| list_yeast_assemblies         | 1.00              | 1.00         |
| lookup_tb_assemblies_by_taxid | 1.00              | 1.00         |
| off_topic_redirect            | 0.00              | 0.00         |
| transcriptomics_workflows     | 1.00              | 1.00         |

</details>

## `workflow_recommendation`

| Model             | IwcIdInSet | LLMJudge   | n   | duration |
| ----------------- | ---------- | ---------- | --- | -------- |
| claude-sonnet-4-6 | 5/5 (1.00) | 5/5 (1.00) | 5   | 18.3s    |
| gpt-oss-120b      | 5/5 (1.00) | 5/5 (1.00) | 5   | 14.5s    |

<details><summary>Per-case detail</summary>

| Case               | claude-sonnet-4-6 | gpt-oss-120b |
| ------------------ | ----------------- | ------------ |
| atac_seq           | 1.00              | 1.00         |
| covid_consensus    | 1.00              | 1.00         |
| flu_consensus      | 1.00              | 1.00         |
| tb_variant_calling | 1.00              | 1.00         |
| yeast_rnaseq_pe    | 1.00              | 1.00         |

</details>
