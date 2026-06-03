# BRC Analytics evals

- Generated: 2026-05-24T12:18:32Z
- Commit: `d15cd681`
- Datasets: sra_tool_selection
- Models: gpt-oss-120b

## `sra_tool_selection`

| Model        | ToolCallMatch  | \_AnyOfTheseTools | \_NoneOfTheseTools | \_ReplyMustMention | n   | duration |
| ------------ | -------------- | ----------------- | ------------------ | ------------------ | --- | -------- |
| gpt-oss-120b | 10.5/11 (0.95) | 2.0/2 (1.00)      | 5.0/5 (1.00)       | 6.5/7 (0.93)       | 13  | 13.6s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                               | gpt-oss-120b |
| ---------------------------------- | ------------ |
| biggest_tb_project_flexible        | 1.00         |
| country_filter_kenya               | 1.00         |
| negative_assembly_details          | 1.00         |
| negative_organism_search           | 1.00         |
| negative_transcriptomics_workflows | 1.00         |
| negative_workflow_categories       | 1.00         |
| negative_workflow_compatibility    | 1.00         |
| platform_filter_nanopore           | 1.00         |
| study_lookup_prjeb2136             | 1.00         |
| summary_candida_auris_old_name     | 1.00         |
| summary_candidozyma_new_name       | 1.00         |
| summary_falciparum                 | 1.00         |
| summary_sars_cov_2_via_old_name    | 0.50         |

</details>
