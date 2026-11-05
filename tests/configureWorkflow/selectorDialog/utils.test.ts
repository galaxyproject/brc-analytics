import { closeUnlessBackdropClick } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/SelectorDialog/utils";

describe("closeUnlessBackdropClick", () => {
  test("does not close on a backdrop click", () => {
    const onClose = jest.fn();
    closeUnlessBackdropClick(onClose, "backdropClick");
    expect(onClose).not.toHaveBeenCalled();
  });

  test("closes on Escape", () => {
    const onClose = jest.fn();
    closeUnlessBackdropClick(onClose, "escapeKeyDown");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
