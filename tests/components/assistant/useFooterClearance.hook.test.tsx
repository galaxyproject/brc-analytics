import { GAP } from "@repo/shared/views/AssistantView/components/Conversation/constants";
import { useFooterClearance } from "@repo/shared/views/AssistantView/components/Conversation/hooks/UseFooterClearance/hook";
import { act, render } from "@testing-library/react";
import { type JSX, useRef } from "react";

interface ObserverMock {
  callback: ResizeObserverCallback;
  disconnect: jest.Mock;
  observe: jest.Mock;
}

const FOOTER_HEIGHT = 114;

const observers: ObserverMock[] = [];

let footerHeight: number;

/**
 * A conversation with a footer, as the chat renders it.
 * @returns The conversation element.
 */
function Conversation(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const footerRef = useFooterClearance(ref);
  return (
    <div data-testid="conversation" ref={ref}>
      <div ref={footerRef} />
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
 * Reports a resize to the footer's observer, as the browser does when it
 * starts observing and when the footer's size changes.
 */
function resize(): void {
  act(() =>
    observers[observers.length - 1].callback(
      [],
      {} as unknown as ResizeObserver
    )
  );
}

beforeEach(() => {
  observers.length = 0;
  footerHeight = FOOTER_HEIGHT;
  // jsdom has no layout, so the footer reports whatever height is set here.
  jest
    .spyOn(HTMLElement.prototype, "offsetHeight", "get")
    .mockImplementation(() => footerHeight);
  global.ResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
    const observer = { callback, disconnect: jest.fn(), observe: jest.fn() };
    observers.push(observer);
    return observer;
  }) as unknown as typeof ResizeObserver;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useFooterClearance", () => {
  test("keeps the footer's height and the gap above it clear", () => {
    const { getByTestId } = render(<Conversation />);
    resize();
    expect(getClearance(getByTestId("conversation"))).toBe(
      `${FOOTER_HEIGHT + GAP}px`
    );
  });

  test("follows the footer as it resizes", () => {
    const { getByTestId } = render(<Conversation />);
    resize();
    footerHeight = FOOTER_HEIGHT + 60;
    resize();
    expect(getClearance(getByTestId("conversation"))).toBe(
      `${FOOTER_HEIGHT + 60 + GAP}px`
    );
  });

  test("clears it when the conversation goes", () => {
    const { getByTestId, unmount } = render(<Conversation />);
    const conversation = getByTestId("conversation");
    resize();
    unmount();
    expect(observers[0].disconnect).toHaveBeenCalled();
    expect(getClearance(conversation)).toBe("");
  });
});
