import { REPLY_PLACEHOLDER } from "@repo/shared/views/AssistantView/components/Conversation/components/Composer/constants";
import { IME_PROCESSING_KEY_CODE } from "@repo/shared/views/AssistantView/components/Conversation/components/Composer/hooks/UseComposer/constants";
import {
  canSendMessage,
  onComposerKeyDown,
} from "@repo/shared/views/AssistantView/components/Conversation/components/Composer/hooks/UseComposer/utils";
import { getPlaceholder } from "@repo/shared/views/AssistantView/components/Conversation/components/Composer/utils";
import { ASSISTANT_INPUT_PLACEHOLDER } from "@repo/shared/views/AssistantView/constants";
import type { KeyboardEvent } from "react";

interface KeyDownOptions {
  isComposing?: boolean;
  key?: string;
  keyCode?: number;
  shiftKey?: boolean;
}

interface KeyDown {
  event: KeyboardEvent<HTMLTextAreaElement>;
  preventDefault: jest.Mock;
  requestSubmit: jest.Mock;
}

/**
 * Builds a key-down event on a textarea inside a form, with spies on the
 * calls that submit it.
 * @param options - Key and modifier state.
 * @param options.isComposing - Whether an IME composition is in progress.
 * @param options.key - Key pressed.
 * @param options.keyCode - Key code the browser reports.
 * @param options.shiftKey - Whether Shift is held.
 * @returns The event and its spies.
 */
function keyDown({
  isComposing = false,
  key = "Enter",
  keyCode = 13,
  shiftKey = false,
}: KeyDownOptions = {}): KeyDown {
  const preventDefault = jest.fn();
  const requestSubmit = jest.fn();
  const event = {
    currentTarget: { form: { requestSubmit } },
    key,
    nativeEvent: { isComposing, keyCode },
    preventDefault,
    shiftKey,
  } as unknown as KeyboardEvent<HTMLTextAreaElement>;
  return { event, preventDefault, requestSubmit };
}

describe("canSendMessage", () => {
  test("sends text while the assistant is free", () => {
    expect(canSendMessage("Which assemblies exist?", false)).toBe(true);
  });

  test("doesn't send an empty composer", () => {
    expect(canSendMessage("", false)).toBe(false);
  });

  test("doesn't send whitespace alone", () => {
    expect(canSendMessage("  \n\t ", false)).toBe(false);
  });

  test("doesn't send while the assistant is busy", () => {
    expect(canSendMessage("Which assemblies exist?", true)).toBe(false);
  });
});

describe("onComposerKeyDown", () => {
  test("submits the form on Enter", () => {
    const { event, preventDefault, requestSubmit } = keyDown();
    onComposerKeyDown(event);
    expect(preventDefault).toHaveBeenCalled();
    expect(requestSubmit).toHaveBeenCalled();
  });

  test("leaves Shift+Enter to start a new line", () => {
    const { event, preventDefault, requestSubmit } = keyDown({
      shiftKey: true,
    });
    onComposerKeyDown(event);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(requestSubmit).not.toHaveBeenCalled();
  });

  test("leaves Enter that confirms an IME composition to the IME", () => {
    const { event, preventDefault, requestSubmit } = keyDown({
      isComposing: true,
    });
    onComposerKeyDown(event);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(requestSubmit).not.toHaveBeenCalled();
  });

  // Safari reports the confirming Enter with isComposing false.
  test("leaves Enter with the IME processing key code to the IME", () => {
    const { event, preventDefault, requestSubmit } = keyDown({
      keyCode: IME_PROCESSING_KEY_CODE,
    });
    onComposerKeyDown(event);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(requestSubmit).not.toHaveBeenCalled();
  });

  test("ignores other keys", () => {
    const { event, preventDefault, requestSubmit } = keyDown({
      key: "a",
      keyCode: 65,
    });
    onComposerKeyDown(event);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(requestSubmit).not.toHaveBeenCalled();
  });
});

describe("getPlaceholder", () => {
  test("asks the question as the rest of the site does on an empty chat", () => {
    expect(getPlaceholder(false)).toBe(ASSISTANT_INPUT_PLACEHOLDER);
  });

  test("invites a reply once the conversation has started", () => {
    expect(getPlaceholder(true)).toBe(REPLY_PLACEHOLDER);
  });
});
