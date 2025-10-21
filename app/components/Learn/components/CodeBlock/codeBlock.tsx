import { ReactNode } from "react";
import { StyledCodeBlock, StyledLanguageTag } from "./codeBlock.styles";
import DOMPurify from "isomorphic-dompurify";

export interface CodeBlockProps {
  children: ReactNode;
  className?: string;
  language?: string;
}

export const CodeBlock = ({
  children,
  className,
  language,
}: CodeBlockProps): JSX.Element => {
  // Extract language from className (if using ```javascript syntax)
  const languageFromClass = className
    ? className.replace("language-", "")
    : null;
  const displayLanguage = language || languageFromClass || null;

  // Sanitize code content
  const codeContent =
    typeof children === "string" ? DOMPurify.sanitize(children) : children;

  return (
    <StyledCodeBlock>
      {displayLanguage && (
        <StyledLanguageTag>{displayLanguage}</StyledLanguageTag>
      )}
      <code>{codeContent}</code>
    </StyledCodeBlock>
  );
};
