import { FOOTER_HEIGHT_PROPERTY } from "@repo/shared/views/AssistantView/components/Conversation/constants";
import { useFooterClearance } from "@repo/shared/views/AssistantView/components/Conversation/hooks/UseFooterClearance/hook";
import { act, render } from "@testing-library/react";
import { type JSX } from "react";

interface ObserverMock {
  callback: ResizeObserverCallback;
  disconnect: jest.Mock;
  observe: jest.Mock;
}

const FOOTER_HEIGHT = 114;

const observers: ObserverMock[] = [];

let renders = 0;

/**
 * A conversation with a footer, as the chat renders it.
 * @returns The conversation element.
 */
function Conversation(): JSX.Element {
  const { ref } = useFooterClearance();
  return (
    <div>
      <Messages />
      <div ref={ref} />
    </div>
  );
}

/**
 * The conversation's messages, counting their renders.
 * @returns Nothing.
 */
function Messages(): null {
  renders++;
  return null;
}

/**
 * The footer's height, as set on the HTML element.
 * @returns The custom property's value.
 */
function getFooterHeight(): string {
  return document.documentElement.style.getPropertyValue(
    FOOTER_HEIGHT_PROPERTY
  );
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
  renders = 0;
  global.ResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
    const observer = { callback, disconnect: jest.fn(), observe: jest.fn() };
    observers.push(observer);
    return observer;
  }) as unknown as typeof ResizeObserver;
});

describe("useFooterClearance", () => {
  test("sets no height until the footer is measured", () => {
    render(<Conversation />);
    expect(getFooterHeight()).toBe("");
  });

  test("sets the footer's height on the HTML element", () => {
    render(<Conversation />);
    resize(FOOTER_HEIGHT);
    expect(getFooterHeight()).toBe(`${FOOTER_HEIGHT}px`);
  });

  test("follows the footer as it resizes", () => {
    render(<Conversation />);
    resize(FOOTER_HEIGHT);
    resize(FOOTER_HEIGHT + 60);
    expect(getFooterHeight()).toBe(`${FOOTER_HEIGHT + 60}px`);
  });

  test("doesn't re-render the conversation's contents as the footer resizes", () => {
    render(<Conversation />);
    resize(FOOTER_HEIGHT);
    const measured = renders;
    resize(FOOTER_HEIGHT + 60);
    resize(FOOTER_HEIGHT + 120);
    expect(renders).toBe(measured);
  });

  test("stops watching the footer and removes its height when the conversation goes", () => {
    const { unmount } = render(<Conversation />);
    resize(FOOTER_HEIGHT);
    unmount();
    expect(observers[0].disconnect).toHaveBeenCalled();
    expect(getFooterHeight()).toBe("");
  });
});
