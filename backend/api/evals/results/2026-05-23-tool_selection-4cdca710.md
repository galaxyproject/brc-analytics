# BRC Analytics evals

- Generated: 2026-05-24T02:46:20Z
- Commit: `4cdca710`
- Datasets: tool_selection
- Models: gpt-oss-120b

## `tool_selection`

| Model        | ToolCallMatch | \_NoToolCalls | \_ReplyMustMention | n   | duration |
| ------------ | ------------- | ------------- | ------------------ | --- | -------- |
| gpt-oss-120b | 7.0/7 (1.00)  | 1.0/1 (1.00)  | 2.0/2 (1.00)       | 8   | 11.3s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                          | gpt-oss-120b |
| ----------------------------- | ------------ |
| assembly_details              | 1.00         |
| compatibility_check           | 1.00         |
| compatible_workflows_haploid  | 1.00         |
| list_workflow_categories      | 1.00         |
| list_yeast_assemblies         | 1.00         |
| lookup_tb_assemblies_by_taxid | 1.00         |
| off_topic_redirect            | 1.00         |
| transcriptomics_workflows     | 1.00         |

</details>
