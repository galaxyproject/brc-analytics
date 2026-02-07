import { test, expect } from "@playwright/test";

test.describe("BRC Analytics - Invalid Query Detection", () => {
  // Test data sets
  const INVALID_QUERIES = [
    // Nonsense strings
    { description: "Random nonsense string", query: "sdfsdfs" },
    { description: "Mixed letters and numbers nonsense", query: "xyzabc123" },
    { description: "Keyboard pattern", query: "qwerty" },
    { description: "Random keyboard characters", query: "asdfghjkl" },

    // Empty/whitespace
    { description: "Empty string", query: "" },
    { description: "Whitespace only", query: "   " },
    { description: "Newlines only", query: "\n\n" },
    { description: "Tab character only", query: "\t" },

    // Special characters
    { description: "Special characters only", query: "@#$%^&*" },
    { description: "Punctuation only", query: "!!!???" },
    { description: "Angle brackets", query: "<<<>>>" },

    // Numbers only
    { description: "Numbers only", query: "12345" },
    { description: "Repeated numbers", query: "999999" },
    { description: "Zeros only", query: "0000" },

    // Non-bioinformatics content
    { description: "Weather query", query: "weather forecast tomorrow" },
    { description: "Finance query", query: "stock price of Apple" },
    { description: "Cooking query", query: "recipe for chocolate cake" },
    { description: "Automotive query", query: "how to fix my car" },

    // Mixed nonsense
    {
      description: "Mixed nonsense with special chars",
      query: "sdf123 @#$ xyz",
    },
    { description: "Random English words", query: "random words here there" },
    {
      description: "Nonsensical word combination",
      query: "lalala banana potato",
    },
  ];

  const VALID_QUERIES = [
    { description: "Simple organism query", query: "E. coli RNA-seq data" },
    {
      description: "Malaria parasite query",
      query: "Plasmodium falciparum genome",
    },
    {
      description: "Technology and date query",
      query: "PacBio sequencing from 2023",
    },
    {
      description: "Assembly level query",
      query: "Complete genome assemblies",
    },
    {
      description: "Disease condition query",
      query: "Drug-resistant tuberculosis strains",
    },
  ];

  test("should reject nonsense string queries", async ({ request }) => {
    const nonsenseQueries = INVALID_QUERIES.filter(
      (q) =>
        q.description.includes("nonsense") || q.description.includes("Random")
    );

    for (const testCase of nonsenseQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query: testCase.query },
        }
      );

      console.log(`🚫 Testing: ${testCase.description} - "${testCase.query}"`);

      expect(response.status()).toBe(400);

      const result = await response.json();
      expect(result.detail).toContain("Invalid query");
      expect(result.detail.toLowerCase()).toContain("bioinformatics");
    }
  });

  test("should reject empty and whitespace-only queries", async ({
    request,
  }) => {
    const emptyQueries = INVALID_QUERIES.filter(
      (q) =>
        q.description.includes("Empty") ||
        q.description.includes("Whitespace") ||
        q.description.includes("Newlines") ||
        q.description.includes("Tab")
    );

    for (const testCase of emptyQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query: testCase.query },
        }
      );

      console.log(`🚫 Testing: ${testCase.description} - "${testCase.query}"`);

      expect(response.status()).toBe(400);

      const result = await response.json();
      expect(result.detail).toContain("Invalid query");
    }
  });

  test("should reject special characters and numbers only", async ({
    request,
  }) => {
    const specialQueries = INVALID_QUERIES.filter(
      (q) =>
        q.description.includes("Special") ||
        q.description.includes("Numbers") ||
        q.description.includes("Punctuation") ||
        q.description.includes("brackets")
    );

    for (const testCase of specialQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query: testCase.query },
        }
      );

      console.log(`🚫 Testing: ${testCase.description} - "${testCase.query}"`);

      expect(response.status()).toBe(400);

      const result = await response.json();
      expect(result.detail).toContain("Invalid query");
    }
  });

  test("should reject non-bioinformatics queries", async ({ request }) => {
    const nonBioQueries = INVALID_QUERIES.filter(
      (q) =>
        q.description.includes("Weather") ||
        q.description.includes("Finance") ||
        q.description.includes("Cooking") ||
        q.description.includes("Automotive")
    );

    for (const testCase of nonBioQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query: testCase.query },
        }
      );

      console.log(`🚫 Testing: ${testCase.description} - "${testCase.query}"`);

      expect(response.status()).toBe(400);

      const result = await response.json();
      expect(result.detail).toContain("Invalid query");
      expect(result.detail.toLowerCase()).toContain("bioinformatics");
    }
  });

  test("should accept valid bioinformatics queries", async ({ request }) => {
    for (const testCase of VALID_QUERIES) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query: testCase.query },
        }
      );

      console.log(
        `✅ Testing valid: ${testCase.description} - "${testCase.query}"`
      );

      expect(response.status()).toBe(200);

      const result = await response.json();
      expect(result.status).toBe("success");
      expect(result.interpretation).toBeDefined();
      expect(result.interpretation.confidence).toBeGreaterThanOrEqual(0.3);
    }
  });

  test("should not cache invalid queries", async ({ request }) => {
    const testQuery = "cache test nonsense gibberish xyz123";

    // First request
    const response1 = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { max_results: 5, query: testQuery },
      }
    );

    expect(response1.status()).toBe(400);

    // Second request - should also fail and not be cached
    const response2 = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { max_results: 5, query: testQuery },
      }
    );

    expect(response2.status()).toBe(400);

    const result = await response2.json();
    expect(result.detail).toContain("Invalid query");

    console.log("✅ Invalid queries are not cached");
  });

  test("should provide helpful error messages", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { max_results: 5, query: "sdfsdfs random nonsense" },
      }
    );

    expect(response.status()).toBe(400);

    const result = await response.json();

    // Check that error message is helpful
    expect(result.detail).toContain("Invalid query");
    expect(result.detail.toLowerCase()).toContain("bioinformatics");
    expect(result.detail.toLowerCase()).toContain("search request");

    console.log(`📝 Error message: ${result.detail}`);
  });

  test("should handle confidence threshold enforcement", async ({
    request,
  }) => {
    // This test ensures the API properly rejects low confidence queries
    // We'll use a borderline query that might get low confidence
    const borderlineQuery = "some vague biological term maybe";

    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { max_results: 5, query: borderlineQuery },
      }
    );

    // Should either succeed with confidence >= 0.3 OR fail with 400
    if (response.status() === 200) {
      const result = await response.json();
      expect(result.interpretation.confidence).toBeGreaterThanOrEqual(0.3);
      console.log(
        `✅ Borderline query passed with confidence: ${result.interpretation.confidence}`
      );
    } else {
      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.detail).toMatch(/confidence|invalid/i);
      console.log(`✅ Borderline query rejected: ${result.detail}`);
    }
  });

  test("should reject batch invalid queries efficiently", async ({
    request,
  }) => {
    const batchInvalidQueries = [
      "xyz123",
      "sdfsdfs",
      "@#$%",
      "12345",
      "weather today",
    ];

    const startTime = Date.now();

    for (const query of batchInvalidQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query },
        }
      );

      expect(response.status()).toBe(400);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(
      `⚡ Processed ${batchInvalidQueries.length} invalid queries in ${totalTime}ms`
    );

    // Should be reasonably fast since invalid queries are detected early
    expect(totalTime).toBeLessThan(10000); // Less than 10 seconds for 5 queries
  });
});
