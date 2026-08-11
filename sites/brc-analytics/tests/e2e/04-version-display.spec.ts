import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "./utils/fixtures";

// Client version stamped into the build by scripts/set-version.sh, read from
// the repo-root package.json so the assertion tracks the real release version
// rather than a hardcoded one.
const { version } = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../../../package.json"), "utf8")
) as { version: string };

test.describe("BRC Analytics - Version Display", () => {
  test("footer shows the client build version", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // The footer version chip is `v<version>-<gitHash>`; assert the stamped
    // client version is present.
    await expect(footer).toContainText(`v${version}`);
  });
});
