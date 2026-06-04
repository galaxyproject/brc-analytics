# BRC Analytics evals

- Generated: 2026-05-01T13:44:27Z
- Commit: `a7631b0e`
- Datasets: assistant_multiturn, search_interpretation, tool_selection, workflow_recommendation
- Models: claude-sonnet-4-6

## `assistant_multiturn`

| Model             | FinalSchemaContains | IsCompleteEquals | LLMJudge   | n   | duration |
| ----------------- | ------------------- | ---------------- | ---------- | --- | -------- |
| claude-sonnet-4-6 | 0/3 (0.00)          | 2/3 (0.67)       | 2/3 (0.67) | 3   | 33.3s    |

<details><summary>Per-case detail</summary>

| Case                    | claude-sonnet-4-6                    |
| ----------------------- | ------------------------------------ |
| exploration_only        | 0.00                                 |
| yeast_rnaseq_happy_path | 0.00                                 |
| tb_variant_calling      | FAIL: ContentFilterError: Content fi |

</details>

## `search_interpretation`

| Model             | FieldEquals | FieldEquals_2 | LLMJudge    | n   | duration |
| ----------------- | ----------- | ------------- | ----------- | --- | -------- |
| claude-sonnet-4-6 | 7/10 (0.70) | 5/10 (0.50)   | 7/10 (0.70) | 10  | 19.8s    |

<details><summary>Per-case detail</summary>

| Case                          | claude-sonnet-4-6                    |
| ----------------------------- | ------------------------------------ |
| atac_seq_chromatin            | 0.00                                 |
| candida_auris_drug_resistance | 1.00                                 |
| ecoli_illumina                | 1.00                                 |
| malaria_wgs                   | 1.00                                 |
| nanopore_pacbio_long_reads    | 1.00                                 |
| tb_chipseq                    | 1.00                                 |
| yeast_common_name             | 1.00                                 |
| yeast_rnaseq_2023             | 1.00                                 |
| gibberish                     | FAIL: RuntimeError: Invalid query: T |
| tb_variant_calling_intent     | FAIL: RuntimeError: LLM interpretati |

</details>

## `tool_selection`

| Model             | ToolCallMatch | \_NoToolCalls | \_ReplyMustMention | n   | duration |
| ----------------- | ------------- | ------------- | ------------------ | --- | -------- |
| claude-sonnet-4-6 | 7/8 (0.88)    | 1/8 (0.12)    | 2/8 (0.25)         | 8   | 14.1s    |

<details><summary>Per-case detail</summary>

| Case                          | claude-sonnet-4-6 |
| ----------------------------- | ----------------- |
| assembly_details              | 1.00              |
| compatibility_check           | 1.00              |
| compatible_workflows_haploid  | 1.00              |
| list_workflow_categories      | 1.00              |
| list_yeast_assemblies         | 1.00              |
| lookup_tb_assemblies_by_taxid | 1.00              |
| off_topic_redirect            | 0.00              |
| transcriptomics_workflows     | 1.00              |

</details>

## `workflow_recommendation`

| Model             | IwcIdInSet | LLMJudge   | n   | duration |
| ----------------- | ---------- | ---------- | --- | -------- |
| claude-sonnet-4-6 | 0/3 (0.00) | 3/3 (1.00) | 3   | 16.4s    |

<details><summary>Per-case detail</summary>

| Case               | claude-sonnet-4-6 |
| ------------------ | ----------------- |
| consensus_assembly | 0.00              |
| tb_variant_calling | 0.00              |
| yeast_rnaseq       | 0.00              |

</details>
