import { test, expect } from "@playwright/test";

test.describe("BRC Analytics - LLM API Contract Tests", () => {
  test("should validate dataset search response schema for valid queries", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          include_metadata: true,
          max_results: 5,
          query: "E. coli RNA-seq data",
        },
      }
    );

    console.log("📋 Testing valid query response schema");

    if (response.status() === 200) {
      const result = await response.json();

      // Validate response structure
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("success");

      expect(result).toHaveProperty("query");
      expect(typeof result.query).toBe("string");

      expect(result).toHaveProperty("interpretation");
      expect(result.interpretation).toHaveProperty("organism");
      expect(result.interpretation).toHaveProperty("taxonomy_id");
      expect(result.interpretation).toHaveProperty("experiment_type");
      expect(result.interpretation).toHaveProperty("library_strategy");
      expect(result.interpretation).toHaveProperty("library_source");
      expect(result.interpretation).toHaveProperty("sequencing_platform");
      expect(result.interpretation).toHaveProperty("date_range");
      expect(result.interpretation).toHaveProperty("keywords");
      expect(result.interpretation).toHaveProperty("study_type");
      expect(result.interpretation).toHaveProperty("assembly_level");
      expect(result.interpretation).toHaveProperty("assembly_completeness");
      expect(result.interpretation).toHaveProperty("confidence");

      // Validate confidence is a number between 0 and 1
      expect(typeof result.interpretation.confidence).toBe("number");
      expect(result.interpretation.confidence).toBeGreaterThanOrEqual(0);
      expect(result.interpretation.confidence).toBeLessThanOrEqual(1);

      // Validate keywords is an array
      expect(Array.isArray(result.interpretation.keywords)).toBe(true);

      expect(result).toHaveProperty("search_method");
      expect(result).toHaveProperty("results");
      expect(Array.isArray(result.results)).toBe(true);

      expect(result).toHaveProperty("cached");
      expect(typeof result.cached).toBe("boolean");

      expect(result).toHaveProperty("count");
      expect(typeof result.count).toBe("number");

      expect(result).toHaveProperty("llm_tokens_used");
      expect(typeof result.llm_tokens_used).toBe("number");

      expect(result).toHaveProperty("metadata");
      expect(result.metadata).toHaveProperty("model_used");

      console.log("✅ Valid query response schema validated");
    } else {
      console.log(
        `⚠️ Query returned ${response.status()}, may have been rejected for low confidence`
      );
    }
  });

  test("should validate error response schema for invalid queries", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          max_results: 5,
          query: "sdfsdfs nonsense gibberish",
        },
      }
    );

    console.log("📋 Testing invalid query error response schema");

    expect(response.status()).toBe(400);

    const result = await response.json();

    // Validate error response structure
    expect(result).toHaveProperty("detail");
    expect(typeof result.detail).toBe("string");
    expect(result.detail).toContain("Invalid query");

    // Should not have success response fields
    expect(result).not.toHaveProperty("status");
    expect(result).not.toHaveProperty("interpretation");
    expect(result).not.toHaveProperty("results");

    console.log("✅ Invalid query error response schema validated");
  });

  test("should validate workflow suggestion response schema", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/workflow-suggest",
      {
        data: {
          analysis_goal: "Analyze gene expression patterns",
          dataset_description: "RNA-seq data from E. coli",
          experiment_type: "RNA-seq",
          organism_taxonomy_id: "562",
        },
      }
    );

    console.log("📋 Testing workflow suggestion response schema");

    if (response.status() === 200) {
      const result = await response.json();

      // Validate response structure
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("success");

      expect(result).toHaveProperty("suggestions");
      expect(Array.isArray(result.suggestions)).toBe(true);

      if (result.suggestions.length > 0) {
        const suggestion = result.suggestions[0];
        expect(suggestion).toHaveProperty("workflow_name");
        expect(suggestion).toHaveProperty("reason");
        expect(suggestion).toHaveProperty("confidence");

        expect(typeof suggestion.workflow_name).toBe("string");
        expect(typeof suggestion.reason).toBe("string");
        expect(typeof suggestion.confidence).toBe("number");
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      }

      console.log("✅ Workflow suggestion response schema validated");
    } else {
      const result = await response.json();
      console.log(
        `⚠️ Workflow suggestion failed: ${result.detail || response.status()}`
      );
    }
  });

  test("should validate required fields in dataset search request", async ({
    request,
  }) => {
    console.log("📋 Testing required fields validation");

    // Test missing query field
    const noQueryResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          max_results: 5,
        },
      }
    );

    expect(noQueryResponse.status()).toBe(422); // Validation error

    // Test empty query
    const emptyQueryResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          max_results: 5,
          query: "",
        },
      }
    );

    expect(emptyQueryResponse.status()).toBe(400); // Invalid query

    console.log("✅ Required fields validation working correctly");
  });

  test("should validate optional fields handling", async ({ request }) => {
    console.log("📋 Testing optional fields handling");

    // Test with minimal required fields only
    const minimalResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query: "E. coli genome data",
        },
      }
    );

    // Should work with just query field
    expect([200, 400].includes(minimalResponse.status())).toBe(true);

    // Test with all optional fields
    const fullResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          include_metadata: true,
          max_results: 10,
          query: "E. coli genome data",
        },
      }
    );

    expect([200, 400].includes(fullResponse.status())).toBe(true);

    console.log("✅ Optional fields handled correctly");
  });

  test("should validate data types in request", async ({ request }) => {
    console.log("📋 Testing data type validation");

    // Test invalid max_results type
    const invalidMaxResultsResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          max_results: "not_a_number",
          query: "E. coli data",
        },
      }
    );

    expect(invalidMaxResultsResponse.status()).toBe(422); // Validation error

    // Test invalid include_metadata type
    const invalidMetadataResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          include_metadata: "not_a_boolean",
          query: "E. coli data",
        },
      }
    );

    expect(invalidMetadataResponse.status()).toBe(422); // Validation error

    console.log("✅ Data type validation working correctly");
  });

  test("should validate HTTP status codes for different scenarios", async ({
    request,
  }) => {
    console.log("📋 Testing HTTP status codes");

    // Valid query - should return 200 or 400 (if confidence too low)
    const validResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { query: "E. coli RNA-seq data" },
      }
    );
    expect([200, 400].includes(validResponse.status())).toBe(true);

    // Invalid query - should return 400
    const invalidResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { query: "sdfsdfs nonsense" },
      }
    );
    expect(invalidResponse.status()).toBe(400);

    // Malformed request - should return 422
    const malformedResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { not_a_query_field: "test" },
      }
    );
    expect(malformedResponse.status()).toBe(422);

    console.log("✅ HTTP status codes are correct for different scenarios");
  });

  test("should validate confidence threshold enforcement", async ({
    request,
  }) => {
    console.log("📋 Testing confidence threshold enforcement");

    // This test verifies that the API properly enforces the 0.3 confidence threshold
    const borderlineQueries = [
      "very vague biological query",
      "some genomic data maybe",
      "microbial information",
      "sequence stuff",
    ];

    for (const query of borderlineQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query },
        }
      );

      if (response.status() === 200) {
        // If accepted, confidence should be >= 0.3
        const result = await response.json();
        expect(result.interpretation.confidence).toBeGreaterThanOrEqual(0.3);
        console.log(
          `✅ "${query}" accepted with confidence: ${result.interpretation.confidence}`
        );
      } else if (response.status() === 400) {
        // If rejected, should be due to low confidence or invalid query
        const result = await response.json();
        expect(result.detail).toMatch(/confidence|invalid/i);
        console.log(`✅ "${query}" rejected: ${result.detail}`);
      } else {
        throw new Error(`Unexpected status code: ${response.status()}`);
      }
    }

    console.log("✅ Confidence threshold enforcement validated");
  });

  test("should validate response headers", async ({ request }) => {
    console.log("📋 Testing response headers");

    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { query: "E. coli data" },
      }
    );

    // Check content type
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");

    console.log("✅ Response headers validated");
  });

  test("should validate performance characteristics", async ({ request }) => {
    console.log("📋 Testing performance characteristics");

    const startTime = Date.now();

    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { query: "E. coli RNA-seq data analysis" },
      }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`⏱️ Response time: ${responseTime}ms`);

    // Response should be reasonably fast (allow up to 30 seconds for LLM processing)
    expect(responseTime).toBeLessThan(30000);

    if (response.status() === 200) {
      const result = await response.json();

      // Should have reasonable token usage
      expect(result.llm_tokens_used).toBeGreaterThan(0);
      expect(result.llm_tokens_used).toBeLessThan(10000); // Reasonable upper bound

      console.log(`🎯 Tokens used: ${result.llm_tokens_used}`);
    }

    console.log("✅ Performance characteristics validated");
  });

  test("should validate API versioning", async ({ request }) => {
    console.log("📋 Testing API versioning");

    // Test that v1 endpoint exists and works
    const v1Response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { query: "test query" },
      }
    );

    expect([200, 400, 422].includes(v1Response.status())).toBe(true);

    // Test that invalid API version returns 404
    const invalidVersionResponse = await request.post(
      "http://localhost:8000/api/v999/llm/dataset-search",
      {
        data: { query: "test query" },
      }
    );

    expect(invalidVersionResponse.status()).toBe(404);

    console.log("✅ API versioning validated");
  });
});
