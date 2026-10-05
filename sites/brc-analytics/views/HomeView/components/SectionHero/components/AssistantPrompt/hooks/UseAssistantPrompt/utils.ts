import { ROUTES } from "@brc/routes/constants";
import { FIELD_NAME } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Form/constants";
import { getFormValues } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Form/utils";
import { ASSISTANT_QUERY_PARAM } from "@repo/shared/views/AssistantView/constants";
import type { UrlObject } from "url";

/**
 * Returns the assistant URL for the given question.
 * @param question - Question to open the assistant with.
 * @returns Assistant URL.
 */
export function getAssistantUrl(question: string): UrlObject {
  return {
    pathname: ROUTES.ASSISTANT,
    query: { [ASSISTANT_QUERY_PARAM.QUESTION]: question },
  };
}

/**
 * Returns the assistant URL for the given question as a plain href, for a
 * navigation the router can't make.
 * @param question - Question to open the assistant with.
 * @returns Assistant href.
 */
export function getAssistantHref(question: string): string {
  const query = new URLSearchParams({
    [ASSISTANT_QUERY_PARAM.QUESTION]: question,
  });
  return `${ROUTES.ASSISTANT}?${query}`;
}

/**
 * Returns the question currently typed into the form.
 * Read from the form rather than the field: the field is controlled inside the
 * library component, which exposes no value to read. Reuses the same extractor
 * as submitting, so both paths read the question the same way.
 * @param form - Form the input event bubbled to.
 * @returns Typed question, trimmed.
 */
export function getInputValue(form: HTMLFormElement): string {
  return getFormValues(form)[FIELD_NAME.AI_PROMPT] ?? "";
}
