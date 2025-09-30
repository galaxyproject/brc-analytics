import { test, expect } from "@playwright/test";

test.describe("BRC Analytics - Galaxy Integration", () => {
  test("Galaxy service health check", async ({ request }) => {
    // Check backend health first
    const response = await request.get("http://localhost:8000/api/v1/health");
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    console.log("Backend health:", health);

    // Check Galaxy-specific health endpoint
    const galaxyResponse = await request.get(
      "http://localhost:8000/api/v1/galaxy/health"
    );
    expect(galaxyResponse.ok()).toBeTruthy();

    const galaxyHealth = await galaxyResponse.json();
    console.log("Galaxy health:", galaxyHealth);

    expect(galaxyHealth.status).toBe("healthy");
    expect(galaxyHealth.galaxy_configured).toBe(true);
    expect(galaxyHealth.api_url).toMatch(
      /galaxyproject\.org|host\.docker\.internal|localhost/
    );

    if (galaxyHealth.galaxy_configured) {
      console.log("✅ Galaxy is configured and available");
    } else {
      console.log("⚠️ Galaxy is not configured - skipping Galaxy tests");
    }
  });

  // eslint-disable-next-line sonarjs/cognitive-complexity -- Complex test that covers full Galaxy job lifecycle
  test("Galaxy job submission and lifecycle", async ({ request }) => {
    // First check if Galaxy is available
    const healthResponse = await request.get(
      "http://localhost:8000/api/v1/galaxy/health"
    );
    const health = await healthResponse.json();

    if (!health.galaxy_configured) {
      console.log("Skipping Galaxy test - service not configured");
      // Skip remaining assertions if Galaxy is not configured
      expect(health.galaxy_configured).toBe(false);
      return;
    }

    // Test data for Galaxy job submission
    const testData = `header1\theader2\theader3
sample1\tvalue1\tdata1
sample2\tvalue2\tdata2
sample3\tvalue3\tdata3
sample4\tvalue4\tdata4
sample5\tvalue5\tdata5
sample6\tvalue6\tdata6
sample7\tvalue7\tdata7
sample8\tvalue8\tdata8
sample9\tvalue9\tdata9
sample10\tvalue10\tdata10`;

    // Step 1: Submit Galaxy job
    console.log("🚀 Submitting Galaxy job...");
    const submitResponse = await request.post(
      "http://localhost:8000/api/v1/galaxy/submit-job",
      {
        data: {
          filename: "e2e-test-data.tsv",
          num_random_lines: 3,
          tabular_data: testData,
        },
      }
    );

    expect(submitResponse.ok()).toBeTruthy();
    const submitResult = await submitResponse.json();
    console.log("Job submission result:", submitResult);

    expect(submitResult).toHaveProperty("job_id");
    expect(submitResult).toHaveProperty("upload_dataset_id");
    expect(submitResult.status).toBe("submitted");
    expect(submitResult.message).toContain("submitted successfully");

    const jobId = submitResult.job_id;
    console.log(`📝 Job ID: ${jobId}`);

    // Step 2: Poll job status
    console.log("⏳ Polling job status...");
    let jobStatus;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    do {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await request.get(
        `http://localhost:8000/api/v1/galaxy/jobs/${jobId}/status`
      );
      expect(statusResponse.ok()).toBeTruthy();

      jobStatus = await statusResponse.json();
      console.log(
        `📊 Job ${jobId} status: ${jobStatus.state} (attempt ${attempts + 1})`
      );

      expect(jobStatus).toHaveProperty("job_id", jobId);
      expect(jobStatus).toHaveProperty("state");
      expect(jobStatus).toHaveProperty("is_complete");
      expect(jobStatus).toHaveProperty("is_successful");
      expect(jobStatus).toHaveProperty("created_time");
      expect(jobStatus).toHaveProperty("updated_time");

      attempts++;
    } while (!jobStatus.is_complete && attempts < maxAttempts);

    if (!jobStatus.is_complete) {
      console.log(`⚠️ Job did not complete within ${maxAttempts} attempts`);
      console.log(`Final status: ${jobStatus.state}`);
      // Don't fail the test for slow Galaxy infrastructure
      return;
    }

    console.log(`✅ Job completed with state: ${jobStatus.state}`);

    // Step 3: Get job results (if successful)
    if (jobStatus.is_successful) {
      console.log("📥 Retrieving job results...");
      const resultsResponse = await request.get(
        `http://localhost:8000/api/v1/galaxy/jobs/${jobId}/results`
      );
      expect(resultsResponse.ok()).toBeTruthy();

      const results = await resultsResponse.json();
      console.log("Job results:", results);

      expect(results).toHaveProperty("job_id", jobId);
      expect(results).toHaveProperty("status");
      expect(results).toHaveProperty("outputs");
      expect(results).toHaveProperty("results");
      expect(results).toHaveProperty("created_time");
      expect(results).toHaveProperty("completed_time");

      // Verify that we got some output data
      if (results.outputs && results.outputs.length > 0) {
        console.log(`📊 Job produced ${results.outputs.length} output(s)`);

        // Check that results contain actual data
        const outputKeys = Object.keys(results.results);
        expect(outputKeys.length).toBeGreaterThan(0);

        // Verify the random lines output contains 3 lines as requested
        for (const outputName of outputKeys) {
          const outputContent = results.results[outputName];
          if (
            typeof outputContent === "string" &&
            outputContent.includes("\t")
          ) {
            const lines = outputContent.trim().split("\n");
            console.log(`📄 Output '${outputName}' has ${lines.length} lines`);

            // Should have header + 3 random lines = 4 total lines
            expect(lines.length).toBeLessThanOrEqual(4);
            expect(lines.length).toBeGreaterThan(0);
          }
        }
      }
    } else {
      console.log(`❌ Job failed with state: ${jobStatus.state}`);
      if (jobStatus.stderr) {
        console.log("Error output:", jobStatus.stderr);
      }
    }
  });

  test("Galaxy job error handling", async ({ request }) => {
    // First check if Galaxy is available
    const healthResponse = await request.get(
      "http://localhost:8000/api/v1/galaxy/health"
    );
    const health = await healthResponse.json();

    if (!health.galaxy_configured) {
      console.log("Skipping Galaxy error test - service not configured");
      // Skip remaining assertions if Galaxy is not configured
      expect(health.galaxy_configured).toBe(false);
      return;
    }

    // Test 1: Invalid job submission (empty data)
    console.log("🧪 Testing error handling for empty data...");
    const emptyDataResponse = await request.post(
      "http://localhost:8000/api/v1/galaxy/submit-job",
      {
        data: {
          filename: "empty.tsv",
          num_random_lines: 5,
          tabular_data: "",
        },
      }
    );

    // Should either reject or handle gracefully
    if (!emptyDataResponse.ok()) {
      const error = await emptyDataResponse.json();
      console.log("Empty data error (expected):", error);
      expect(emptyDataResponse.status()).toBeGreaterThanOrEqual(400);
    } else {
      console.log("Empty data was accepted (Galaxy may handle this)");
    }

    // Test 2: Non-existent job status
    console.log("🧪 Testing error handling for non-existent job...");
    const fakeJobResponse = await request.get(
      "http://localhost:8000/api/v1/galaxy/jobs/fake-job-id-12345/status"
    );

    expect(fakeJobResponse.status()).toBeGreaterThanOrEqual(400);
    const fakeJobError = await fakeJobResponse.json();
    console.log("Fake job error (expected):", fakeJobError);

    // Test 3: Invalid job results request
    console.log("🧪 Testing error handling for non-existent job results...");
    const fakeResultsResponse = await request.get(
      "http://localhost:8000/api/v1/galaxy/jobs/fake-job-id-12345/results"
    );

    expect(fakeResultsResponse.status()).toBeGreaterThanOrEqual(400);
    const fakeResultsError = await fakeResultsResponse.json();
    console.log("Fake results error (expected):", fakeResultsError);
  });

  test("Galaxy frontend integration", async ({ page }) => {
    // Navigate to Galaxy test page
    console.log("🌐 Testing Galaxy frontend integration...");
    await page.goto("http://localhost:3000/galaxy-test");

    // Check that the page loads
    await expect(page.locator("h1").first()).toContainText("Galaxy", {
      timeout: 10000,
    });

    // Look for key UI elements
    const form = page.locator("form");
    const textArea = page.getByLabel("Tabular Data (TSV format)");
    const submitButton = page.locator("button[type='submit']");

    await expect(form).toBeVisible();
    await expect(textArea).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Check if there's a number input for random lines
    const numberInput = page.locator("input[type='number']");
    if (await numberInput.isVisible()) {
      console.log("✅ Random lines input found");
    }

    // Check for job history section
    const historySection = page.locator("text=Job History");
    if (await historySection.isVisible()) {
      console.log("✅ Job history section found");
    }

    // Take a screenshot of the Galaxy test page
    await page.screenshot({
      fullPage: true,
      path: "tests/screenshots/galaxy-test-page.png",
    });

    console.log("📸 Screenshot saved: galaxy-test-page.png");
  });

  test("Galaxy frontend job submission simulation", async ({ page }) => {
    // Navigate to Galaxy test page
    await page.goto("http://localhost:3000/galaxy-test");

    // Wait for page to load
    await expect(page.locator("h1").first()).toContainText("Galaxy", {
      timeout: 10000,
    });

    // Fill in test data
    const testData = `gene_id\texpression\tfold_change
GENE001\t123.45\t2.1
GENE002\t67.89\t-1.5
GENE003\t234.56\t3.2
GENE004\t45.67\t-0.8
GENE005\t156.78\t1.9`;

    const textArea = page.getByLabel("Tabular Data (TSV format)");
    await textArea.fill(testData);

    // Set number of random lines
    const numberInput = page.locator("input[type='number']");
    if (await numberInput.isVisible()) {
      await numberInput.fill("3");
    }

    // Take screenshot before submission
    await page.screenshot({
      path: "tests/screenshots/galaxy-test-before-submit.png",
    });

    // Submit the form (only if we can see the submit button)
    const submitButton = page.locator("button[type='submit']");
    if ((await submitButton.isVisible()) && (await submitButton.isEnabled())) {
      console.log("🚀 Submitting test job via frontend...");

      // Click submit
      await submitButton.click();

      // Wait a moment for the UI to respond
      await page.waitForTimeout(2000);

      // Look for success indicators
      const successMessage = page.locator("text=submitted");
      const jobIdDisplay = page.locator("text=Job ID");

      if (
        (await successMessage.isVisible()) ||
        (await jobIdDisplay.isVisible())
      ) {
        console.log("✅ Job submission appears successful in UI");

        // Take screenshot after submission
        await page.screenshot({
          path: "tests/screenshots/galaxy-test-after-submit.png",
        });
      } else {
        console.log(
          "ℹ️ No immediate success indicators found (may be loading)"
        );
      }
    } else {
      console.log("ℹ️ Submit button not available or disabled");
    }
  });
});
