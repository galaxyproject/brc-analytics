# BRC Analytics evals

- Generated: 2026-11-07T14:47:37Z
- Commit: `f28e26525`
- Datasets: structured_channel
- Models: MiniMax-M2.7

## `structured_channel`

| Model        | CaptureOnChange | ExtractSuccessRate | FinalSchemaContains | IsCompleteEquals | NoLeak       | ReplySuccessRate | SchemaFieldEmpty | n   | duration |
| ------------ | --------------- | ------------------ | ------------------- | ---------------- | ------------ | ---------------- | ---------------- | --- | -------- |
| MiniMax-M2.7 | 4.8/6 (0.79)    | 6.0/6 (1.00)       | 3.0/4 (0.75)        | 5.0/6 (0.83)     | 6.0/6 (1.00) | 6.0/6 (1.00)     | 3.0/3 (1.00)     | 6   | 74.2s    |

<details><summary>Per-case detail (average across evaluators)</summary>

| Case                  | MiniMax-M2.7 |
| --------------------- | ------------ |
| build_decision        | 0.83         |
| clear_field           | 0.93         |
| complete_handoff      | 0.79         |
| explore_only          | 1.00         |
| offered_not_committed | 1.00         |
| switch_decision       | 0.92         |

</details>
