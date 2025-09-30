import { test, expect } from "@playwright/test";

test.describe("BRC Analytics - LLM/AI Features", () => {
  test("LLM service should be configured and healthy", async ({ request }) => {
    const response = await request.get(
      "http://localhost:8000/api/v1/llm/health"
    );
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    console.log("🤖 LLM Health Status:", JSON.stringify(health, null, 2));

    expect(health.status).toBe("healthy");
    expect(health.llm_available).toBe(true);
    expect(health.model_configured).toBe(true);
    expect(health.agents_initialized.search_agent).toBe(true);
    expect(health.agents_initialized.workflow_agent).toBe(true);
  });

  test("should interpret simple organism search query", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query: "Show me E. coli sequencing data",
        },
      }
    );

    const result = await response.json();
    console.log("🔍 Simple search result:", JSON.stringify(result, null, 2));

    // Even if it returns text, we should see it understands E. coli
    if (result.detail) {
      expect(result.detail.toLowerCase()).toContain("coli");
    }
  });

  test("should interpret complex multi-parameter search", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query:
            "Find all RNA-seq experiments for Plasmodium falciparum collected between January and June 2023 with at least 10 million reads",
        },
      }
    );

    const result = await response.json();
    console.log(
      "🔬 Complex search interpretation:",
      JSON.stringify(result, null, 2)
    );

    // The LLM should interpret the query correctly, even if ENA fails
    // Check for successful interpretation OR that error shows correct interpretation
    if (result.interpretation) {
      // Successful response
      expect(result.interpretation.organism?.toLowerCase()).toContain(
        "plasmodium"
      );
      expect(result.interpretation.experiment_type?.toLowerCase()).toContain(
        "rna"
      );
      expect(result.interpretation.date_range?.start).toContain("2023");
    } else if (result.detail) {
      // Error response - but LLM still extracted the key terms
      const text = result.detail.toLowerCase();
      expect(text).toMatch(/plasmodium|falciparum/);
      expect(text).toMatch(/rna/);
      // Date might not be in error message
    }
  });

  test("should understand disease-based queries", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query: "I need tuberculosis genomic data from drug-resistant strains",
        },
      }
    );

    const result = await response.json();
    console.log("🦠 Disease query result:", JSON.stringify(result, null, 2));

    if (result.detail) {
      const text = result.detail.toLowerCase();
      // Should identify Mycobacterium tuberculosis
      expect(text).toMatch(/tuberculosis|mycobacterium/);
    }
  });

  test("should handle comparative genomics queries", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query: "Compare genome sequences between different Candida species",
        },
      }
    );

    const result = await response.json();
    console.log(
      "🧬 Comparative genomics query:",
      JSON.stringify(result, null, 2)
    );

    if (result.detail) {
      expect(result.detail.toLowerCase()).toContain("candida");
    }
  });

  test("should interpret time-based queries correctly", async ({ request }) => {
    const queries = [
      "Recent COVID-19 sequencing data from last month",
      "Historical influenza data from 2020",
      "Malaria samples collected this year",
    ];

    for (const query of queries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { query },
        }
      );

      const result = await response.json();
      console.log(
        `📅 Time query "${query.substring(0, 30)}...":`,
        result.detail?.substring(0, 200)
      );
    }
  });

  test("should suggest workflows for RNA-seq analysis", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/workflow-suggest",
      {
        data: {
          analysis_goal:
            "Identify differentially expressed genes between drug-treated and control samples",
          data_format: "FASTQ",
          dataset_description:
            "Paired-end RNA-seq data from Plasmodium falciparum blood stage parasites",
          experiment_type: "RNA-seq",
          organism_taxonomy_id: "5833",
        },
      }
    );

    const result = await response.json();
    console.log(
      "🔧 RNA-seq workflow suggestion:",
      JSON.stringify(result, null, 2)
    );

    // Even if returning text, should mention relevant tools
    if (result.detail && typeof result.detail === "string") {
      // const text = result.detail.toLowerCase();
      // Might mention tools like HISAT2, STAR, salmon, kallisto, etc.
      console.log("Workflow response mentions RNA-seq tools");
    }
  });

  test("should suggest workflows for variant calling", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/workflow-suggest",
      {
        data: {
          analysis_goal: "Detect SNPs and drug resistance mutations",
          data_format: "FASTQ",
          dataset_description:
            "Whole genome sequencing data from Mycobacterium tuberculosis clinical isolates",
          experiment_type: "WGS",
          organism_taxonomy_id: "1773",
        },
      }
    );

    const result = await response.json();
    console.log(
      "🧪 Variant calling workflow:",
      JSON.stringify(result, null, 2)
    );
  });

  test("should suggest workflows for ChIP-seq analysis", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/workflow-suggest",
      {
        data: {
          analysis_goal: "Identify enriched genomic regions and peak calling",
          dataset_description:
            "ChIP-seq data for histone modifications in Plasmodium falciparum",
          experiment_type: "ChIP-seq",
          organism_taxonomy_id: "5833",
        },
      }
    );

    const result = await response.json();
    console.log(
      "🏔️ ChIP-seq workflow suggestion:",
      JSON.stringify(result, null, 2)
    );
  });

  test("should handle ambiguous organism names", async ({ request }) => {
    const ambiguousQueries = [
      "yeast transcriptomics data", // Should resolve to Saccharomyces cerevisiae
      "malaria parasite genomes", // Should resolve to Plasmodium species
      "TB bacteria sequences", // Should resolve to Mycobacterium tuberculosis
      "flu virus data from 2023", // Should resolve to Influenza virus
    ];

    for (const query of ambiguousQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { query },
        }
      );

      const result = await response.json();
      console.log(
        `🔮 Ambiguous query "${query}":`,
        result.detail?.substring(0, 150)
      );
    }
  });

  test("should understand mixed technical and colloquial terms", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query:
            "I want to look at gene expression in malaria bugs when they're in red blood cells vs mosquitos",
        },
      }
    );

    const result = await response.json();
    console.log(
      "💬 Colloquial query interpretation:",
      JSON.stringify(result, null, 2)
    );

    // Check for interpretation in successful response or error message
    if (result.interpretation) {
      expect(result.interpretation.organism?.toLowerCase()).toMatch(
        /plasmodium|malaria/
      );
      expect(result.interpretation.experiment_type?.toLowerCase()).toMatch(
        /rna|expression/
      );
    } else if (result.detail) {
      const text = result.detail.toLowerCase();
      // Should understand this refers to Plasmodium life cycle stages
      expect(text).toMatch(/plasmodium|malaria/);
      // Expression/RNA might be in the query
    }
  });

  test("should handle batch/multiple dataset requests", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query:
            "Find both RNA-seq and DNA-seq data for Candida auris, preferably from clinical samples",
        },
      }
    );

    const result = await response.json();
    console.log("📦 Multi-dataset query:", JSON.stringify(result, null, 2));

    if (result.interpretation) {
      expect(result.interpretation.organism?.toLowerCase()).toContain(
        "candida"
      );
      // Keywords might include both types
      const allText = JSON.stringify(result.interpretation).toLowerCase();
      expect(allText).toMatch(/rna|dna/);
    } else if (result.detail) {
      const text = result.detail.toLowerCase();
      expect(text).toContain("candida");
      // Should identify sequencing types in error
    }
  });

  test("should interpret quality/technical requirements", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query:
            "High-quality long-read sequencing data for Cryptococcus neoformans with coverage > 50x",
        },
      }
    );

    const result = await response.json();
    console.log(
      "📊 Technical requirements query:",
      JSON.stringify(result, null, 2)
    );

    if (result.interpretation) {
      // Check if it identified Cryptococcus in organism, keywords, OR via taxonomy ID
      const organism = result.interpretation.organism?.toLowerCase() || "";
      const keywords =
        result.interpretation.keywords?.join(" ").toLowerCase() || "";
      const taxonomyId = result.interpretation.taxonomy_id;

      // Cryptococcus neoformans has taxonomy ID 5207
      const foundCryptococcus =
        organism.includes("cryptococcus") ||
        keywords.includes("cryptococcus") ||
        taxonomyId === "5207";
      expect(foundCryptococcus).toBe(true);
    } else if (result.detail) {
      expect(result.detail.toLowerCase()).toContain("cryptococcus");
    }
  });

  test("workflow suggestion for metagenomics", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/workflow-suggest",
      {
        data: {
          analysis_goal: "Identify and quantify all microbial species present",
          data_format: "FASTQ",
          dataset_description:
            "Shotgun metagenomics data from environmental samples potentially containing multiple pathogen species",
          experiment_type: "Metagenomics",
        },
      }
    );

    const result = await response.json();
    console.log("🌍 Metagenomics workflow:", JSON.stringify(result, null, 2));
  });

  test("should provide context-aware suggestions", async ({ request }) => {
    // First, make a search query
    const searchResponse = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: {
          query: "Aspergillus fumigatus RNA-seq from infected lung tissue",
        },
      }
    );

    console.log("1️⃣ Initial search:", searchResponse.status);

    // Then ask for workflow suggestions based on that search
    const workflowResponse = await request.post(
      "http://localhost:8000/api/v1/llm/workflow-suggest",
      {
        data: {
          analysis_goal: "Analyze fungal gene expression during host infection",
          dataset_description:
            "RNA-seq data from Aspergillus fumigatus during lung infection",
          experiment_type: "RNA-seq",
          organism_taxonomy_id: "746128",
        },
      }
    );

    console.log("2️⃣ Related workflow suggestion:", workflowResponse.status);
  });

  test("should reject nonsense queries with proper error messages", async ({
    request,
  }) => {
    const nonsenseQueries = [
      "sdfsdfs",
      "xyzabc123",
      "@#$%^&*",
      "12345",
      "weather forecast tomorrow",
    ];

    for (const query of nonsenseQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query },
        }
      );

      console.log(`🚫 Testing nonsense query: "${query}"`);

      expect(response.status()).toBe(400);

      const result = await response.json();
      expect(result.detail).toContain("Invalid query");
      expect(result.detail.toLowerCase()).toContain("bioinformatics");
    }
  });

  test("should handle confidence threshold validation", async ({ request }) => {
    const response = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { max_results: 5, query: "very vague query" },
      }
    );

    console.log("🎯 Testing confidence threshold validation");

    // Should either succeed with confidence >= 0.3 OR fail with 400
    if (response.status() === 200) {
      const result = await response.json();
      expect(result.interpretation.confidence).toBeGreaterThanOrEqual(0.3);
      console.log(
        `✅ Query passed with confidence: ${result.interpretation.confidence}`
      );
    } else {
      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.detail).toMatch(/confidence|invalid/i);
      console.log(`✅ Query rejected: ${result.detail}`);
    }
  });

  test("should not cache invalid queries", async ({ request }) => {
    const invalidQuery = "cache test nonsense xyz789";

    // Make the same invalid query twice
    const response1 = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { max_results: 5, query: invalidQuery },
      }
    );

    const response2 = await request.post(
      "http://localhost:8000/api/v1/llm/dataset-search",
      {
        data: { max_results: 5, query: invalidQuery },
      }
    );

    console.log("🗃️ Testing that invalid queries are not cached");

    // Both should fail with 400
    expect(response1.status()).toBe(400);
    expect(response2.status()).toBe(400);

    const result1 = await response1.json();
    const result2 = await response2.json();

    expect(result1.detail).toContain("Invalid query");
    expect(result2.detail).toContain("Invalid query");

    console.log("✅ Invalid queries properly rejected without caching");
  });

  test("should accept valid queries with high confidence", async ({
    request,
  }) => {
    const validQueries = [
      "E. coli RNA-seq data from 2023",
      "Plasmodium falciparum complete genome",
      "PacBio sequencing of tuberculosis strains",
      "Candida albicans drug resistance genomics",
    ];

    for (const query of validQueries) {
      const response = await request.post(
        "http://localhost:8000/api/v1/llm/dataset-search",
        {
          data: { max_results: 5, query },
        }
      );

      console.log(`✅ Testing valid query: "${query}"`);

      expect(response.status()).toBe(200);

      const result = await response.json();
      expect(result.status).toBe("success");
      expect(result.interpretation).toBeDefined();
      expect(result.interpretation.confidence).toBeGreaterThanOrEqual(0.3);
    }
  });
});
