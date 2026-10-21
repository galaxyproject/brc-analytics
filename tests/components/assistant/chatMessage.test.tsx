import { ChatMessage } from "@repo/shared/views/AssistantView/components/ChatMessage/chatMessage";
import { render, screen } from "@testing-library/react";
import { type JSX } from "react";

// MarkdownContent pulls in rehype-react, an ESM-only package Jest can't parse.
jest.mock(
  "@repo/shared/views/AssistantView/components/ChatMessage/markdownContent",
  () => ({
    MarkdownContent: ({ content }: { content: string }): JSX.Element => (
      <div>{content}</div>
    ),
  })
);

describe("ChatMessage", () => {
  test("renders the app's own note without a bubble or assistant avatar", () => {
    const { container } = render(
      <ChatMessage content="Organism cleared." role="system" />
    );
    expect(screen.getByText("Organism cleared.")).toBeTruthy();
    expect(screen.queryByAltText("Assistant")).toBeNull();
    expect(container.querySelector(".MuiPaper-root")).toBeNull();
  });

  test("still renders the assistant's reply in its bubble", () => {
    render(<ChatMessage content="Which organism?" role="assistant" />);
    expect(screen.getByAltText("Assistant")).toBeTruthy();
  });
});
