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

// jsdom has no ResizeObserver; the chip's tooltip hook only needs it to exist.
beforeAll(() => {
  global.ResizeObserver = class {
    disconnect(): void {}
    observe(): void {}
    unobserve(): void {}
  };
});

beforeEach(() => {
  jest.clearAllMocks();
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
    const onSend = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={false}
        onSend={onSend}
      />
    );
    fireEvent.click(getDeleteIcon(screen.getByRole("button")));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith(
      "Let's not use that organism; I'll choose a different one."
    );
  });

  test("does not clear when the chip itself is clicked", () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={false}
        onSend={onSend}
      />
    );
    fireEvent.click(screen.getByText("Plasmodium falciparum"));
    expect(onSend).not.toHaveBeenCalled();
  });

  test("does not clear while a reply is in flight", () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={true}
        onSend={onSend}
      />
    );
    const chip = screen.getByRole("button");
    expect(chip.classList.contains("Mui-disabled")).toBe(true);
    // The disabled class blocks the pointer; a focused chip still fires its
    // delete from the keyboard, so the handler itself must hold off too.
    fireEvent.click(getDeleteIcon(chip));
    fireEvent.keyUp(chip, { key: "Backspace" });
    expect(onSend).not.toHaveBeenCalled();
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
        onSend={jest.fn()}
      />
    );
    expect(screen.getByText("Paired-end WGS reads")).toBeTruthy();
    expect(container.querySelector(".MuiChip-deleteIcon")).toBeNull();
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
        onSend={jest.fn()}
      />
    );
    expect(screen.getByText("Not set")).toBeTruthy();
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
