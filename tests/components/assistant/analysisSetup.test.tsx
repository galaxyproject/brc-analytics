import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { ThemeProvider } from "@mui/material";
import type {
  AnalysisSchema,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import { AnalysisSetup } from "@repo/shared/views/AssistantView/components/AnalysisSetup/analysisSetup";
import { Action } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Action/action";
import { ACTION_PLACEMENT } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Action/constants";
import { FilledValue } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/FilledValue/filledValue";
import { FieldValueSelector } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/selector/fieldValueSelector";
import { Header } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Header/header";
import { fireEvent, render, screen } from "@testing-library/react";
import Router from "next/router";
import type { ComponentProps } from "react";

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
    const onSend = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={false}
        onSend={onSend}
      />
    );
    fireEvent.click(
      getDeleteIcon(
        screen.getByRole("button", {
          name: "Remove organism: Plasmodium falciparum",
        })
      )
    );
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith(
      "Let's not use that organism; I'll choose a different one."
    );
  });

  test("clears from the keyboard, as the remove control it is named", () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    render(
      <FilledValue
        field={ORGANISM}
        fieldKey="organism"
        loading={false}
        onSend={onSend}
      />
    );
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onSend).toHaveBeenCalledTimes(1);
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
    fireEvent.keyDown(chip, { key: "Enter" });
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
        onSend={jest.fn()}
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
        onSend={jest.fn()}
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
        onSend={jest.fn()}
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
        onSend={jest.fn()}
        optional={false}
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
        onSend={jest.fn()}
        optional={false}
      />
    );
    expect(screen.getByText("Not set")).toBeTruthy();
  });

  test("shows an empty field optional for the chosen workflow as optional", () => {
    render(
      <FieldValueSelector
        field={{ detail: null, status: "empty", value: null }}
        fieldKey="gene_annotation"
        loading={false}
        onSend={jest.fn()}
        optional
      />
    );
    expect(screen.getByText("Optional")).toBeTruthy();
    expect(screen.queryByText("Not set")).toBeNull();
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
        onSend={jest.fn()}
        optional={false}
      />
    );
    expect(screen.getByText("Assembly not found")).toBeTruthy();
  });
});

describe("Header", () => {
  const SET: SchemaFieldState = { detail: null, status: "filled", value: "x" };
  const SCHEMA: AnalysisSchema = {
    analysis_type: SET,
    assembly: SET,
    data_characteristics: SET,
    data_source: SET,
    gene_annotation: { detail: null, status: "empty", value: null },
    organism: SET,
    workflow: SET,
  };

  test("counts every field before the assistant has returned a schema", () => {
    render(<Header schema={null} />);
    expect(screen.getByText("0 of 7 set")).toBeTruthy();
  });

  test("leaves gene annotation out of the count when the workflow doesn't need it", () => {
    render(<Header schema={SCHEMA} />);
    expect(screen.getByText("6 of 6 set")).toBeTruthy();
  });

  test("counts gene annotation when it needs attention", () => {
    render(
      <Header
        schema={{
          ...SCHEMA,
          gene_annotation: {
            detail: "No gene model for the selected assembly",
            status: "needs_attention",
            value: "Reference GTF",
          },
        }}
      />
    );
    expect(screen.getByText("6 of 7 set")).toBeTruthy();
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

  /**
   * Renders the action at the panel's end under the app theme, which its
   * narrow-screen styles read breakpoints from.
   * @param props - Action props, less its placement.
   */
  function renderAction(
    props: Omit<ComponentProps<typeof Action>, "placement">
  ): void {
    render(
      <ThemeProvider theme={createAppTheme()}>
        <Action {...props} placement={ACTION_PLACEMENT.END} />
      </ThemeProvider>
    );
  }

  function getButton(): HTMLButtonElement {
    return screen.getByRole("button", {
      name: "Continue to workflow setup",
    }) as HTMLButtonElement;
  }

  test("is disabled until the assistant produces a handoff", () => {
    renderAction({ handoffUrl: null, loading: false, schema: SCHEMA });
    expect(getButton().disabled).toBe(true);
  });

  test("is disabled while a reply is in flight", () => {
    renderAction({ handoffUrl: HANDOFF_URL, loading: true, schema: SCHEMA });
    expect(getButton().disabled).toBe(true);
  });

  // The panel renders it at its start too once complete, for narrow screens;
  // only one copy may be exposed at a time.
  test("is offered once by the panel, at any screen width", () => {
    render(
      <ThemeProvider theme={createAppTheme()}>
        <AnalysisSetup
          handoffUrl={HANDOFF_URL}
          loading={false}
          onSend={jest.fn()}
          schema={SCHEMA}
        />
      </ThemeProvider>
    );
    expect(
      screen.getAllByRole("button", { name: "Continue to workflow setup" })
    ).toHaveLength(1);
  });

  test("hands off the captured accessions and navigates to setup", () => {
    renderAction({ handoffUrl: HANDOFF_URL, loading: false, schema: SCHEMA });
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
