import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { ThemeProvider } from "@mui/material";
import { Conversation as ChatConversation } from "@repo/shared/views/AssistantView/components/Conversation/conversation";
import { useRevealLatest } from "@repo/shared/views/AssistantView/components/Conversation/hooks/UseRevealLatest/hook";
import { act, render } from "@testing-library/react";
import { type JSX, type ReactNode } from "react";

// findable-ui's MarkdownRenderer runs a unified/rehype pipeline whose packages
// are ESM-only, which Jest can't parse. A plain renderer stands in for it.
jest.mock(
  "@databiosphere/findable-ui/lib/components/MarkdownRenderer/markdownRenderer",
  () => ({
    MarkdownRenderer: ({ value }: { value: string }): JSX.Element => (
      <p>{value}</p>
    ),
  })
);

interface ObserverMock {
  callback: ResizeObserverCallback;
  disconnect: jest.Mock;
  observe: jest.Mock;
  unobserve: jest.Mock;
}

const observers: ObserverMock[] = [];

let scrollIntoView: jest.Mock;

/**
 * Sets whether media queries match, standing in for the screen width: the
 * page scrolls the conversation on narrow screens, and the chat column on
 * wider ones.
 * @param matches - Whether the narrow-screen query matches.
 */
function setNarrow(matches: boolean): void {
  window.matchMedia = jest.fn((media: string) => ({
    addEventListener: jest.fn(),
    addListener: jest.fn(),
    dispatchEvent: jest.fn(),
    matches,
    media,
    onchange: null,
    removeEventListener: jest.fn(),
    removeListener: jest.fn(),
  }));
}

/**
 * A conversation: its messages, then the composer, as the chat renders it.
 * @param props - Component props.
 * @param props.messages - Messages in the conversation.
 * @returns The conversation element.
 */
function Conversation({ messages }: { messages: string[] }): JSX.Element {
  const ref = useRevealLatest([messages]);
  return (
    <div data-testid="conversation" ref={ref}>
      <div>
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
      <form />
    </div>
  );
}

/**
 * Provides the app theme, which the hook reads breakpoints from.
 * @param props - Component props.
 * @param props.children - Element to render.
 * @returns The themed element.
 */
function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <ThemeProvider theme={createAppTheme()}>{children}</ThemeProvider>;
}

/**
 * The observer watching the newest message.
 * @returns The latest observer created.
 */
function latestObserver(): ObserverMock {
  return observers[observers.length - 1];
}

beforeEach(() => {
  setNarrow(true);
  observers.length = 0;
  scrollIntoView = jest.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  global.ResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
    const observer = {
      callback,
      disconnect: jest.fn(),
      observe: jest.fn(),
      unobserve: jest.fn(),
    };
    observers.push(observer);
    return observer;
  }) as unknown as typeof ResizeObserver;
});

describe("useRevealLatest", () => {
  test("brings the end of the conversation into view", () => {
    const { getByTestId } = render(<Conversation messages={["Hello"]} />, {
      wrapper,
    });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "end" });
    expect(scrollIntoView.mock.contexts[0]).toBe(getByTestId("conversation"));
  });

  test("brings it into view again as the conversation changes", () => {
    const { rerender } = render(<Conversation messages={["Hello"]} />, {
      wrapper,
    });
    scrollIntoView.mockClear();
    rerender(<Conversation messages={["Hello", "Hi there"]} />);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "end" });
  });

  // Older messages are left alone, so a reader scrolled up through them isn't
  // pulled down when one of them reflows.
  test("watches only the newest message", () => {
    const { getByText } = render(
      <Conversation messages={["Hello", "Hi there"]} />,
      { wrapper }
    );
    const { observe } = latestObserver();
    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledWith(getByText("Hi there"));
  });

  test("brings the end back into view as the newest message grows", () => {
    render(<Conversation messages={["Hello"]} />, { wrapper });
    scrollIntoView.mockClear();
    act(() => latestObserver().callback([], {} as unknown as ResizeObserver));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "end" });
  });

  test("moves to the new newest message as the conversation changes", () => {
    const { getByText, rerender } = render(
      <Conversation messages={["Hello"]} />,
      { wrapper }
    );
    const first = latestObserver();
    rerender(<Conversation messages={["Hello", "Hi there"]} />);
    expect(first.disconnect).toHaveBeenCalled();
    expect(latestObserver().observe).toHaveBeenCalledWith(
      getByText("Hi there")
    );
  });

  // The chat column scrolls the conversation there, rather than the page.
  test("brings the end into view on wider screens too", () => {
    setNarrow(false);
    const { getByText } = render(<Conversation messages={["Hello"]} />, {
      wrapper,
    });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "end" });
    expect(latestObserver().observe).toHaveBeenCalledWith(getByText("Hello"));
  });

  // The hook finds the newest message by structure: the last child of the
  // conversation's first child. This renders the real conversation, so moving
  // the messages from first place, or wrapping them, fails here.
  test("watches the newest message in the chat's own conversation", () => {
    render(
      <ChatConversation
        error={null}
        handoffUrl={null}
        introText="Welcome"
        isRestoring={false}
        loading={false}
        messages={[
          { content: "Which assemblies exist?", role: "user" },
          { content: "And which workflows?", role: "user" },
        ]}
        onRetry={jest.fn()}
        onSend={jest.fn()}
        schema={null}
        suggestions={[]}
      />,
      { wrapper }
    );
    // Other parts of the chat may observe their own size; this hook's observer
    // is the one that reveals the end.
    const revealing = observers.find(({ callback }) => {
      scrollIntoView.mockClear();
      callback([], {} as unknown as ResizeObserver);
      return scrollIntoView.mock.calls.length > 0;
    });
    const observed: Element = revealing?.observe.mock.calls[0][0];
    expect(observed.textContent).toBe("And which workflows?");
  });

  test("stops watching when the conversation goes", () => {
    const { unmount } = render(<Conversation messages={["Hello"]} />, {
      wrapper,
    });
    unmount();
    expect(latestObserver().disconnect).toHaveBeenCalled();
  });
});
