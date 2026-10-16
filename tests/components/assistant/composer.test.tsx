import type { InputElement } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseControlledInput/types";
import { Composer } from "@repo/shared/views/AssistantView/components/Conversation/components/Composer/composer";
import { ARIA_LABEL } from "@repo/shared/views/AssistantView/components/Conversation/components/Composer/constants";
import {
  act,
  fireEvent,
  render,
  type RenderResult,
  screen,
} from "@testing-library/react";
// jest-dom matchers aren't registered globally in this repo's jest config; opt
// in locally as the sibling suites do.
import "@testing-library/jest-dom";
import { createRef } from "react";

const INPUT_REF = createRef<InputElement>();

const QUESTION = "Which assemblies exist for Plasmodium vivax?";

interface RenderedComposer {
  field: HTMLElement;
  rerender: RenderResult["rerender"];
  send: HTMLElement;
}

/**
 * Renders the composer partway through a conversation.
 * @param disabled - Whether the assistant is busy.
 * @param onSend - Sends a message to the assistant.
 * @returns The composer's field and send button, and a rerender.
 */
function renderComposer(
  disabled: boolean,
  onSend: jest.Mock = jest.fn()
): RenderedComposer {
  const { rerender } = render(
    <Composer
      disabled={disabled}
      hasMessages
      inputRef={INPUT_REF}
      onSend={onSend}
    />
  );
  return {
    field: screen.getByRole("textbox", { name: ARIA_LABEL.INPUT }),
    rerender,
    send: screen.getByRole("button", { name: ARIA_LABEL.SUBMIT }),
  };
}

describe("Composer", () => {
  // The field stays enabled while a reply is in flight, so it keeps focus
  // between turns; only sending is blocked.
  test("accepts typing while the assistant is busy, but doesn't send", () => {
    const onSend = jest.fn();
    const { field, send } = renderComposer(true, onSend);

    fireEvent.change(field, { target: { value: QUESTION } });
    fireEvent.keyDown(field, { key: "Enter" });

    expect(field).toBeEnabled();
    expect(send).toBeDisabled();
    expect(onSend).not.toHaveBeenCalled();
    expect(field).toHaveValue(QUESTION);
  });

  test("sends a draft typed while busy once the assistant is free", () => {
    const onSend = jest.fn();
    const { field, rerender, send } = renderComposer(true, onSend);
    fireEvent.change(field, { target: { value: QUESTION } });

    rerender(
      <Composer
        disabled={false}
        hasMessages
        inputRef={INPUT_REF}
        onSend={onSend}
      />
    );

    expect(field).toHaveValue(QUESTION);
    expect(send).toBeEnabled();
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith(QUESTION);
  });

  test("sends the trimmed message once, and clears it", () => {
    const onSend = jest.fn();
    const { field, send } = renderComposer(false, onSend);

    fireEvent.change(field, { target: { value: `  ${QUESTION}\n` } });
    fireEvent.click(send);

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith(QUESTION);
    expect(field).toHaveValue("");
  });

  // Send is disabled once the field is empty, which would otherwise leave
  // focus on a disabled button.
  test("returns focus to the field after sending", () => {
    const { field, send } = renderComposer(false);

    fireEvent.change(field, { target: { value: QUESTION } });
    act(() => send.focus());
    fireEvent.click(send);

    expect(field).toHaveFocus();
  });
});
