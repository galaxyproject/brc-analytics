import { type Page } from "@playwright/test";
import type {
  AssistantChatResponse,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import { CONTINUE_LABEL } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Action/constants";
import {
  HEADING as COMPLETION_HEADING,
  VIEW_SETUP_LABEL,
} from "@repo/shared/views/AssistantView/components/Conversation/components/Completion/constants";
import { ARIA_LABEL } from "@repo/shared/views/AssistantView/components/Conversation/components/Composer/constants";
import { HEADING as SUGGESTIONS_HEADING } from "@repo/shared/views/AssistantView/components/Conversation/components/Suggestions/constants";
import { expect, test } from "./utils/fixtures";

const ASSISTANT_URL = "/assistant?assistant-ui=true";

const QUESTION = "Haploid variant calling on Plasmodium vivax";

const REPLY = "Your analysis is set up.";

const FILLED: SchemaFieldState = {
  detail: null,
  status: "filled",
  value: "Set",
};

// A reply that completes the analysis setup. The assistant offers no
// suggestions once the setup is complete: the handoff is the Continue button's.
const COMPLETE_REPLY: AssistantChatResponse = {
  handoff_url: "/data/assemblies/GCF_000002415_2/analyze",
  is_complete: true,
  reply: REPLY,
  saved: false,
  saved_analysis_id: null,
  schema_state: {
    analysis_type: FILLED,
    assembly: FILLED,
    data_characteristics: FILLED,
    data_source: FILLED,
    gene_annotation: FILLED,
    organism: FILLED,
    workflow: FILLED,
  },
  session_id: "e2e-session",
  suggestions: [],
};

// A completed reply that still carries a suggestion, as the backend's fallback
// ("What's next?") can: the completion block must still replace it on a phone.
const COMPLETE_REPLY_WITH_SUGGESTION: AssistantChatResponse = {
  ...COMPLETE_REPLY,
  suggestions: [{ label: "What's next?", message: "What's next?" }],
};

/**
 * Stands in for the backend, which this suite doesn't run: the assistant
 * completes the setup on the first message, and every other call is refused,
 * as for a signed-out user.
 * @param page - The Playwright page.
 * @param reply - The reply that completes the setup.
 */
async function mockBackend(
  page: Page,
  reply: AssistantChatResponse
): Promise<void> {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ json: { detail: "Not authenticated" }, status: 401 })
  );
  await page.route("**/api/v1/assistant/info", (route) =>
    route.fulfill({ json: { available: true } })
  );
  await page.route("**/api/v1/assistant/chat", (route) =>
    route.fulfill({ json: reply })
  );
}

/**
 * Opens the new assistant UI and asks a question whose reply completes the
 * setup.
 * @param page - The Playwright page.
 * @param reply - The reply that completes the setup.
 */
async function completeSetup(
  page: Page,
  reply: AssistantChatResponse = COMPLETE_REPLY
): Promise<void> {
  await mockBackend(page, reply);
  await page.goto(ASSISTANT_URL);
  const field = page.getByRole("textbox", { name: ARIA_LABEL.INPUT });
  // Waited for before typing: the send button enables only once React has read
  // the typed value, so it reports that the page has hydrated.
  await field.fill(QUESTION);
  await expect(
    page.getByRole("button", { name: ARIA_LABEL.SUBMIT })
  ).toBeEnabled();
  await field.press("Enter");
  await expect(page.getByText(REPLY)).toBeVisible();
}

test.describe("BRC Analytics - Assistant, completed setup", () => {
  test.describe("on a phone", () => {
    test.use({ viewport: { height: 852, width: 393 } });

    test("offers the handoff in the chat in place of the suggestions", async ({
      page,
    }) => {
      await completeSetup(page, COMPLETE_REPLY_WITH_SUGGESTION);
      await expect(
        page.getByRole("heading", { name: COMPLETION_HEADING })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: SUGGESTIONS_HEADING })
      ).toBeHidden();
    });

    test("shows the setup tab from 'View analysis setup'", async ({ page }) => {
      await completeSetup(page);
      await page.getByRole("button", { name: VIEW_SETUP_LABEL }).click();
      await expect(
        page.getByRole("tab", { name: /Setup/, selected: true })
      ).toBeVisible();
    });
  });

  test.describe("on a desktop", () => {
    test.use({ viewport: { height: 900, width: 1440 } });

    // The setup panel, with its own handoff, is alongside the chat there.
    test("leaves the handoff to the setup panel, with no suggestions", async ({
      page,
    }) => {
      await completeSetup(page);
      await expect(
        page.getByRole("button", { name: CONTINUE_LABEL })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: SUGGESTIONS_HEADING })
      ).toBeHidden();
      await expect(
        page.getByRole("heading", { name: COMPLETION_HEADING })
      ).toBeHidden();
    });
  });
});
