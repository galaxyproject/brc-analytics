import { Fragment, JSX, useMemo } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import rehypeReact from "rehype-react";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

interface MarkdownContentProps {
  content: string;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rehype-react options type is complex
  .use(rehypeReact, { Fragment, jsx, jsxs } as any);

/**
 * Renders a markdown string as React elements.
 * @param props - Component props.
 * @param props.content - Markdown text to render.
 * @returns Rendered markdown content.
 */
export const MarkdownContent = ({
  content,
}: MarkdownContentProps): JSX.Element => {
  const rendered = useMemo(
    () => processor.processSync(content).result as JSX.Element,
    [content]
  );
  return rendered;
};
