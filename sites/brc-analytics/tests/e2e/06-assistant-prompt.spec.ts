import { ASSISTANT_INPUT_PLACEHOLDER } from "@repo/shared/views/AssistantView/constants";
import { expect, test } from "./utils/fixtures";

const QUESTION = "Which assemblies exist for Plasmodium falciparum?";

test.describe("BRC Analytics - Home Assistant Prompt", () => {
  test("the send button waits for a question to send", async ({ page }) => {
    await page.goto("/");

    const send = page.locator("form button[type='submit']");
    await expect(send).toBeDisabled();

    await page.getByPlaceholder(ASSISTANT_INPUT_PLACEHOLDER).fill(QUESTION);
    await expect(send).toBeEnabled();
  });

  test("a question asked in the hero opens the assistant with it", async ({
    page,
  }) => {
    await page.goto("/");

    const prompt = page.getByPlaceholder(ASSISTANT_INPUT_PLACEHOLDER);
    await prompt.fill(QUESTION);
    // Waited for before pressing Enter. The button enables only once React has
    // read the typed value, so it is the page reporting that it has hydrated:
    // Enter submits through a handler that is not attached until then, and a
    // key pressed before it is lost.
    await expect(page.locator("form button[type='submit']")).toBeEnabled();

    await prompt.press("Enter");

    await page.waitForURL(/\/assistant/);
    // Sent as the first message of the conversation. The reply needs a backend
    // this suite doesn't run, so only the question itself is asserted.
    await expect(page.getByText(QUESTION).first()).toBeVisible();
  });

  test("the question doesn't linger in the URL to be asked twice", async ({
    page,
  }) => {
    await page.goto("/");

    const prompt = page.getByPlaceholder(ASSISTANT_INPUT_PLACEHOLDER);
    await prompt.fill(QUESTION);
    // Gates on hydration, as above.
    await expect(page.locator("form button[type='submit']")).toBeEnabled();

    await prompt.press("Enter");

    await page.waitForURL(/\/assistant/);
    await expect(page).not.toHaveURL(/[?&]q=/);
  });
});
