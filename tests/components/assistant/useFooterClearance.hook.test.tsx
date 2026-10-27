import { GAP } from "@repo/shared/views/AssistantView/components/Conversation/constants";
import { useFooterClearance } from "@repo/shared/views/AssistantView/components/Conversation/hooks/UseFooterClearance/hook";
import { act, render } from "@testing-library/react";
import { type JSX } from "react";

interface ObserverMock {
  callback: ResizeObserverCallback;
  observe: jest.Mock;
  unobserve: jest.Mock;
}

const FOOTER_HEIGHT = 114;

const observers: ObserverMock[] = [];

/**
 * A conversation with a footer, as the chat renders it.
 * @returns The conversation element.
 */
function Conversation(): JSX.Element {
  const { ref, style } = useFooterClearance();
  return (
    <div data-testid="conversation" style={style}>
      <div ref={ref} />
    </div>
  );
}

/**
 * The space kept clear of the footer, as set on the conversation.
 * @param conversation - Conversation element.
 * @returns The custom property's value.
 */
function getClearance(conversation: HTMLElement): string {
  return conversation.style.getPropertyValue("--footer-clearance");
}

/**
 * Reports the footer's height to its observer, as the browser does when it
 * starts observing and when the footer's size changes.
 * @param height - Footer's border-box height, in pixels.
 */
function resize(height: number): void {
  const entry = {
    borderBoxSize: [{ blockSize: height, inlineSize: 0 }],
  } as unknown as ResizeObserverEntry;
  act(() =>
    observers[observers.length - 1].callback(
      [entry],
      {} as unknown as ResizeObserver
    )
  );
}

beforeEach(() => {
  observers.length = 0;
  global.ResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
    const observer = { callback, observe: jest.fn(), unobserve: jest.fn() };
    observers.push(observer);
    return observer;
  }) as unknown as typeof ResizeObserver;
});

describe("useFooterClearance", () => {
  test("keeps nothing clear until the footer is measured", () => {
    const { getByTestId } = render(<Conversation />);
    expect(getClearance(getByTestId("conversation"))).toBe("");
  });

  test("keeps the footer's height and the gap above it clear", () => {
    const { getByTestId } = render(<Conversation />);
    resize(FOOTER_HEIGHT);
    expect(getClearance(getByTestId("conversation"))).toBe(
      `${FOOTER_HEIGHT + GAP}px`
    );
  });

  test("follows the footer as it resizes", () => {
    const { getByTestId } = render(<Conversation />);
    resize(FOOTER_HEIGHT);
    resize(FOOTER_HEIGHT + 60);
    expect(getClearance(getByTestId("conversation"))).toBe(
      `${FOOTER_HEIGHT + 60 + GAP}px`
    );
  });

  test("stops watching the footer when the conversation goes", () => {
    const { unmount } = render(<Conversation />);
    unmount();
    expect(observers[0].unobserve).toHaveBeenCalled();
  });
});
