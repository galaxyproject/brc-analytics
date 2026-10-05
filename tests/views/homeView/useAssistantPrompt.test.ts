import { useAssistantPrompt } from "@brc/views/HomeView/components/SectionHero/components/AssistantPrompt/hooks/UseAssistantPrompt/hook";
import { FIELD_NAME } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Form/constants";
import { act, renderHook } from "@testing-library/react";
import type { FormEvent, KeyboardEvent } from "react";

const mockPush = jest.fn().mockResolvedValue(true);
jest.mock("next/router", () => ({
  useRouter: (): { push: jest.Mock } => ({ push: mockPush }),
}));

/**
 * Builds an input event carrying the given question, as the form receives it.
 * @param value - Question typed into the prompt.
 * @returns Input event.
 */
function inputEvent(value: string): FormEvent<HTMLFormElement> {
  const form = document.createElement("form");
  const field = document.createElement("textarea");
  field.name = FIELD_NAME.AI_PROMPT;
  field.value = value;
  form.append(field);
  return { currentTarget: form } as unknown as FormEvent<HTMLFormElement>;
}

/**
 * Builds a keydown event on a field inside a form.
 * @param key - Key pressed.
 * @param shiftKey - Whether shift was held.
 * @param isComposing - Whether an IME is mid-composition.
 * @returns Keydown event and the form's requestSubmit spy.
 */
function keyDownEvent(
  key: string,
  shiftKey = false,
  isComposing = false
): {
  event: KeyboardEvent<HTMLInputElement>;
  requestSubmit: jest.Mock;
} {
  const form = document.createElement("form");
  const field = document.createElement("textarea");
  form.append(field);
  const requestSubmit = jest.fn();
  form.requestSubmit = requestSubmit;
  const preventDefault = jest.fn();
  return {
    event: {
      currentTarget: field,
      key,
      nativeEvent: { isComposing },
      preventDefault,
      shiftKey,
    } as unknown as KeyboardEvent<HTMLInputElement>,
    requestSubmit,
  };
}

describe("useAssistantPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("starts empty, so there is nothing to submit", () => {
    const { result } = renderHook(() => useAssistantPrompt());

    expect(result.current.isEmpty).toBe(true);
  });

  test("is no longer empty once a question is typed", () => {
    const { result } = renderHook(() => useAssistantPrompt());

    act(() => result.current.onInput(inputEvent("Which assemblies exist?")));

    expect(result.current.isEmpty).toBe(false);
  });

  test("treats whitespace as empty", () => {
    // Submitting trims, so whitespace alone would navigate to the assistant
    // with nothing to ask.
    const { result } = renderHook(() => useAssistantPrompt());

    act(() => result.current.onInput(inputEvent("hello")));
    act(() => result.current.onInput(inputEvent("   ")));

    expect(result.current.isEmpty).toBe(true);
  });

  test("is empty again once the question is cleared", () => {
    const { result } = renderHook(() => useAssistantPrompt());

    act(() => result.current.onInput(inputEvent("hello")));
    act(() => result.current.onInput(inputEvent("")));

    expect(result.current.isEmpty).toBe(true);
  });

  test("submits on Enter", () => {
    const { result } = renderHook(() => useAssistantPrompt());
    const { event, requestSubmit } = keyDownEvent("Enter");

    act(() => result.current.onKeyDown(event));

    expect(requestSubmit).toHaveBeenCalled();
  });

  test("leaves Shift+Enter to insert a newline", () => {
    const { result } = renderHook(() => useAssistantPrompt());
    const { event, requestSubmit } = keyDownEvent("Enter", true);

    act(() => result.current.onKeyDown(event));

    expect(requestSubmit).not.toHaveBeenCalled();
  });

  test("leaves an Enter that commits an IME candidate to the field", () => {
    // Composing with an IME, Enter picks the candidate rather than submitting:
    // the question is still mid-conversion, and submitting would ask the
    // assistant the text as it stood before it.
    const { result } = renderHook(() => useAssistantPrompt());
    const { event, requestSubmit } = keyDownEvent("Enter", false, true);

    act(() => result.current.onKeyDown(event));

    expect(requestSubmit).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test("leaves Escape and Tab to the browser", () => {
    // The input's own handlers clear the field on Escape and fill it with the
    // placeholder on Tab, both by setting state directly -- no input event, so
    // emptiness would go stale, and Tab would trap focus in the field.
    const { result } = renderHook(() => useAssistantPrompt());

    for (const key of ["Escape", "Tab"]) {
      const { event, requestSubmit } = keyDownEvent(key);
      act(() => result.current.onKeyDown(event));
      expect(requestSubmit).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  });
});
