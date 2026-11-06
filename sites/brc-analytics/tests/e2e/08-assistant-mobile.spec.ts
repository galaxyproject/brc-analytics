import { type Locator, type Page } from "@playwright/test";
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
import { TABS_LABEL } from "@repo/shared/views/AssistantView/components/Layout/constants";
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
// suggestions once the setup is complete: the Continue button handles the
// handoff.
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
 * Reads an element's height.
 * @param locator - The element.
 * @returns Its rendered height, in pixels.
 */
async function getHeight(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getBoundingClientRect().height);
}

/**
 * Reads the page's scroll padding, which focus and scrolling into view stop
 * below.
 * @param page - The Playwright page.
 * @returns The html element's computed `scroll-padding-top`, in pixels.
 */
async function getScrollPaddingTop(page: Page): Promise<number> {
  return page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
  );
}

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

test.describe("BRC Analytics - Assistant, pinned tab bar", () => {
  test.describe("on a phone", () => {
    test.use({ viewport: { height: 500, width: 390 } });

    test("keeps a focused control below the tab bar", async ({ page }) => {
      await mockBackend(page, COMPLETE_REPLY);
      await page.goto(ASSISTANT_URL);
      const tabBar = page
        .locator(":has(> .MuiTabs-root)")
        .filter({ has: page.getByRole("tablist", { name: TABS_LABEL }) });
      const expected =
        (await getHeight(page.locator("header"))) + (await getHeight(tabBar));
      // The tab bar's height reaches the scroll padding once it is measured.
      await expect
        .poll(() => getScrollPaddingTop(page))
        .toBeCloseTo(expected, 0);

      await page.getByRole("tab", { name: /History/ }).click();
      const signIn = page
        .getByRole("tabpanel", { name: /History/ })
        .getByRole("button", { name: "Sign in" });
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight)
      );
      await signIn.focus();
      const tabBarBox = await tabBar.boundingBox();
      const signInBox = await signIn.boundingBox();
      expect(signInBox?.y).toBeGreaterThanOrEqual(
        (tabBarBox?.y ?? 0) + (tabBarBox?.height ?? 0) - 1
      );
    });
  });

  test.describe("on a desktop", () => {
    test.use({ viewport: { height: 900, width: 1440 } });

    // The tab bar is hidden there, so only the header pads the page.
    test("keeps the header's scroll padding", async ({ page }) => {
      await mockBackend(page, COMPLETE_REPLY);
      await page.goto(ASSISTANT_URL);
      await expect(
        page.getByRole("tablist", { name: TABS_LABEL })
      ).toBeHidden();
      expect(await getScrollPaddingTop(page)).toBeCloseTo(
        await getHeight(page.locator("header")),
        0
      );
    });
  });
});
