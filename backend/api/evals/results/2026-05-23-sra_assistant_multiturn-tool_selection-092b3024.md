# BRC Analytics evals

- Generated: 2026-05-24T02:45:29Z
- Commit: `092b3024`
- Datasets: sra_assistant_multiturn, tool_selection
- Models: gpt-oss-120b

## `sra_assistant_multiturn`

| Model | FinalSchemaContains | IsCompleteEquals | LLMJudge | _ReplyMustMention | n | duration |
|---|---|---|---|---|---|---|
| gpt-oss-120b | 1.0/1 (1.00) | 4.0/4 (1.00) | 0.0/4 (0.00) | 3.0/3 (1.00) | 4 | 23.1s |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case | gpt-oss-120b |
|---|---|
| compare_pf_vs_pv | 0.67 |
| drilldown_to_study_runs | 0.67 |
| synonym_across_turns | 0.67 |
| tb_variant_calling_end_to_end | 0.67 |

</details>

## `tool_selection`

| Model | ToolCallMatch | _NoToolCalls | _ReplyMustMention | n | duration |
|---|---|---|---|---|---|
| gpt-oss-120b | 5.0/7 (0.71) | 1.0/1 (1.00) | 1.0/2 (0.50) | 8 | 10.2s |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case | gpt-oss-120b |
|---|---|
| assembly_details | 1.00 |
| compatibility_check | 0.00 |
| compatible_workflows_haploid | 1.00 |
| list_workflow_categories | 0.00 |
| list_yeast_assemblies | 0.50 |
| lookup_tb_assemblies_by_taxid | 1.00 |
| off_topic_redirect | 1.00 |
| transcriptomics_workflows | 1.00 |

</details>
