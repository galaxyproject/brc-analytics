import type { SchemaFieldState } from "@repo/shared/services/api-client/types";
import { Action } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Action/action";
import { FilledValue } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/FilledValue/filledValue";
import { FieldValueSelector } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/selector/fieldValueSelector";
import { fireEvent, render, screen } from "@testing-library/react";
import Router from "next/router";

jest.mock("next/router", () => ({
  __esModule: true,
  default: { push: jest.fn() },
}));

const onSetHandoff = jest.fn();
jest.mock(
  "@repo/shared/providers/workflowHandoff/hooks/UseHandoffDispatch/hook",
  () => ({
    useHandoffDispatch: (): { onSetHandoff: jest.Mock } => ({ onSetHandoff }),
  })
);

// jsdom does no layout, so a chip never reads as truncated; tests set the
// tooltip title directly to stand in for a truncated label.
let mockTooltipTitle: string | null = null;
jest.mock("@repo/shared/hooks/UseChipTooltipTitle/hook", () => ({
  useChipTooltipTitle: (): {
    ref: { current: null };
    title: string | null;
  } => ({ ref: { current: null }, title: mockTooltipTitle }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockTooltipTitle = null;
});

const ORGANISM: SchemaFieldState = {
  detail: null,
  status: "filled",
  value: "Plasmodium falciparum",
};

function getDeleteIcon(chip: HTMLElement): Element {
  const icon = chip.querySelector(".MuiChip-deleteIcon");
  if (!icon) throw new Error("chip has no delete icon");
  return icon;
}

describe("FilledValue", () => {
  test("clears a user-chosen field from its ×", () => {
    const onClearField = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={false}
        onClearField={onClearField}
      />
    );
    fireEvent.click(
      getDeleteIcon(
        screen.getByRole("button", {
          name: "Remove organism: Plasmodium falciparum",
        })
      )
    );
    expect(onClearField).toHaveBeenCalledTimes(1);
    // The field itself, not a chat message the assistant has to interpret.
    expect(onClearField).toHaveBeenCalledWith("organism");
  });

  test("clears from the keyboard, as the remove control it is named", () => {
    const onClearField = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={false}
        onClearField={onClearField}
      />
    );
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onClearField).toHaveBeenCalledTimes(1);
  });

  test("does not clear when the chip itself is clicked", () => {
    const onClearField = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={false}
        onClearField={onClearField}
      />
    );
    fireEvent.click(screen.getByText("Plasmodium falciparum"));
    expect(onClearField).not.toHaveBeenCalled();
  });

  test("does not clear while a reply is in flight", () => {
    const onClearField = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={true}
        onClearField={onClearField}
      />
    );
    const chip = screen.getByRole("button");
    expect(chip.classList.contains("Mui-disabled")).toBe(true);
    // The disabled class blocks the pointer; a focused chip still fires its
    // delete from the keyboard, so the handler itself must hold off too.
    fireEvent.click(getDeleteIcon(chip));
    fireEvent.keyUp(chip, { key: "Backspace" });
    fireEvent.keyDown(chip, { key: "Enter" });
    expect(onClearField).not.toHaveBeenCalled();
  });

  test("offers no × for a derived field", () => {
    const { container } = render(
      <FilledValue
        field={{
          detail: null,
          status: "filled",
          value: "Paired-end WGS reads",
        }}
        fieldKey="data_characteristics"
        loading={false}
        onClearField={jest.fn()}
      />
    );
    expect(screen.getByText("Paired-end WGS reads")).toBeTruthy();
    expect(container.querySelector(".MuiChip-deleteIcon")).toBeNull();
  });
});

describe("FilledValue tooltip focus", () => {
  const DERIVED: SchemaFieldState = {
    detail: null,
    status: "filled",
    value: "Paired-end WGS reads",
  };

  function getWrapper(container: HTMLElement): Element | null | undefined {
    return container.querySelector(".MuiChip-root")?.parentElement;
  }

  test("makes a truncated derived chip focusable, so its tooltip opens on focus", () => {
    mockTooltipTitle = "Paired-end WGS reads";
    const { container } = render(
      <FilledValue
        field={DERIVED}
        fieldKey="data_characteristics"
        loading={false}
        onClearField={jest.fn()}
      />
    );
    expect(getWrapper(container)?.getAttribute("tabindex")).toBe("0");
  });

  test("leaves an untruncated derived chip out of the tab order", () => {
    const { container } = render(
      <FilledValue
        field={DERIVED}
        fieldKey="data_characteristics"
        loading={false}
        onClearField={jest.fn()}
      />
    );
    expect(getWrapper(container)?.hasAttribute("tabindex")).toBe(false);
  });

  test("doesn't add a tab stop for a removable chip, which takes focus itself", () => {
    mockTooltipTitle = "Plasmodium falciparum";
    const { container } = render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={false}
        onClearField={jest.fn()}
      />
    );
    expect(getWrapper(container)?.hasAttribute("tabindex")).toBe(false);
  });
});

describe("FieldValueSelector", () => {
  test("shows an unknown status as not set", () => {
    render(
      <FieldValueSelector
        field={{
          detail: null,
          status: "pending" as SchemaFieldState["status"],
          value: "Plasmodium falciparum",
        }}
        fieldKey="organism"
        loading={false}
        onClearField={jest.fn()}
      />
    );
    expect(screen.getByText("Not set")).toBeTruthy();
  });

  test("shows a field needing attention with no reason or value as not set", () => {
    render(
      <FieldValueSelector
        field={{ detail: null, status: "needs_attention", value: null }}
        fieldKey="organism"
        loading={false}
        onClearField={jest.fn()}
      />
    );
    expect(screen.getByText("Not set")).toBeTruthy();
  });

  test("shows the reason a field needs attention", () => {
    render(
      <FieldValueSelector
        field={{
          detail: "Assembly not found",
          status: "needs_attention",
          value: "GCF_000002765.6",
        }}
        fieldKey="assembly"
        loading={false}
        onClearField={jest.fn()}
      />
    );
    expect(screen.getByText("Assembly not found")).toBeTruthy();
  });
});

describe("Action", () => {
  const HANDOFF_URL = "/data/assemblies/GCF_000002765_6/analyze/workflow";
  const SCHEMA = {
    analysis_type: ORGANISM,
    assembly: ORGANISM,
    data_characteristics: ORGANISM,
    data_source: {
      detail: '{"source": "ena", "accessions": ["ERR16655350"]}',
      status: "filled" as const,
      value: "Public ENA run ERR16655350",
    },
    gene_annotation: ORGANISM,
    organism: ORGANISM,
    workflow: ORGANISM,
  };

  function getButton(): HTMLButtonElement {
    return screen.getByRole("button", {
      name: "Continue to workflow setup",
    }) as HTMLButtonElement;
  }

  test("is disabled until the assistant produces a handoff", () => {
    render(<Action handoffUrl={null} loading={false} schema={SCHEMA} />);
    expect(getButton().disabled).toBe(true);
  });

  test("is disabled while a reply is in flight", () => {
    render(<Action handoffUrl={HANDOFF_URL} loading={true} schema={SCHEMA} />);
    expect(getButton().disabled).toBe(true);
  });

  test("hands off the captured accessions and navigates to setup", () => {
    render(<Action handoffUrl={HANDOFF_URL} loading={false} schema={SCHEMA} />);
    fireEvent.click(getButton());
    expect(onSetHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.objectContaining({ accessions: ["ERR16655350"] }),
        path: HANDOFF_URL,
      })
    );
    expect(Router.push).toHaveBeenCalledWith(HANDOFF_URL);
  });
});
