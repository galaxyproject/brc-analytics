import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { ThemeProvider } from "@mui/material";
import type {
  AnalysisSchema,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import { CONTINUE_LABEL } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Action/constants";
import { Completion } from "@repo/shared/views/AssistantView/components/Conversation/components/Completion/completion";
import {
  HEADING,
  TEXT,
  VIEW_SETUP_LABEL,
} from "@repo/shared/views/AssistantView/components/Conversation/components/Completion/constants";
import { LAYOUT_TAB } from "@repo/shared/views/AssistantView/components/Layout/constants";
import { SelectTabContext } from "@repo/shared/views/AssistantView/components/Layout/context";
import { fireEvent, render, screen } from "@testing-library/react";
import Router from "next/router";
// jest-dom matchers aren't registered globally in this repo's jest config; opt
// in locally as the sibling suites do.
import "@testing-library/jest-dom";

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

const HANDOFF_URL = "/data/assemblies/GCF_000002415_2/analyze";

const FILLED: SchemaFieldState = { detail: null, status: "filled", value: "x" };

const SCHEMA: AnalysisSchema = {
  analysis_type: FILLED,
  assembly: FILLED,
  data_characteristics: FILLED,
  data_source: {
    detail: '{"source": "ena", "accessions": ["ERR16655350"]}',
    status: "filled",
    value: "Public ENA run ERR16655350",
  },
  gene_annotation: FILLED,
  organism: FILLED,
  workflow: FILLED,
};

interface RenderOptions {
  disabled?: boolean;
  handoffUrl?: string | null;
  onSelectTab?: jest.Mock;
}

/**
 * Renders the completion block inside the layout's tab switching, under the
 * app theme its narrow-screen styles read breakpoints from.
 * @param options - Props to override.
 * @param options.disabled - Whether a reply is in flight.
 * @param options.handoffUrl - Workflow setup URL, or null while incomplete.
 * @param options.onSelectTab - Switches the column shown.
 * @returns The render's container.
 */
function renderCompletion({
  disabled = false,
  handoffUrl = HANDOFF_URL,
  onSelectTab = jest.fn(),
}: RenderOptions = {}): HTMLElement {
  const { container } = render(
    <ThemeProvider theme={createAppTheme()}>
      <SelectTabContext.Provider value={onSelectTab}>
        <Completion
          disabled={disabled}
          handoffUrl={handoffUrl}
          schema={SCHEMA}
        />
      </SelectTabContext.Provider>
    </ThemeProvider>
  );
  return container;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Completion", () => {
  test("renders nothing until the setup is complete", () => {
    const container = renderCompletion({ handoffUrl: null });
    expect(container).toBeEmptyDOMElement();
  });

  test("offers the next steps once the setup is complete", () => {
    renderCompletion();
    expect(screen.getByRole("heading", { name: HEADING })).toBeInTheDocument();
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CONTINUE_LABEL })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: VIEW_SETUP_LABEL })
    ).toBeEnabled();
  });

  test("hands off the captured accessions and navigates to workflow setup", () => {
    renderCompletion();
    fireEvent.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    expect(onSetHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.objectContaining({ accessions: ["ERR16655350"] }),
        path: HANDOFF_URL,
      })
    );
    expect(Router.push).toHaveBeenCalledWith(HANDOFF_URL);
  });

  // The handoff URL may change with the reply.
  test("holds the handoff while a reply is in flight", () => {
    renderCompletion({ disabled: true });
    expect(screen.getByRole("button", { name: CONTINUE_LABEL })).toBeDisabled();
  });

  test("shows the setup tab from 'View analysis setup'", () => {
    const onSelectTab = jest.fn();
    renderCompletion({ onSelectTab });
    fireEvent.click(screen.getByRole("button", { name: VIEW_SETUP_LABEL }));
    expect(onSelectTab).toHaveBeenCalledWith(LAYOUT_TAB.SETUP);
  });
});
