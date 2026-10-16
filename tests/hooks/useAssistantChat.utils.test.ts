import { keepSavedAnalysisId } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/utils";

// A session's analysis never changes, so a turn that reports none for the same
// session must not clear the one the chat history has selected.
describe("keepSavedAnalysisId", () => {
  test("takes the analysis the turn reports", () => {
    expect(keepSavedAnalysisId(null, "analysis-1", true)).toBe("analysis-1");
    expect(keepSavedAnalysisId("analysis-1", "analysis-2", false)).toBe(
      "analysis-2"
    );
  });

  test("keeps the known analysis when the same session reports none", () => {
    expect(keepSavedAnalysisId("analysis-1", null, true)).toBe("analysis-1");
  });

  test("drops it when a different session reports none", () => {
    expect(keepSavedAnalysisId("analysis-1", null, false)).toBeNull();
  });
});
