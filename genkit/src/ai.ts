import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { logger } from "@genkit-ai/core/logging";
import dotenv from "dotenv";
import { mcpClient } from "genkitx-mcp";

// Import providers based on installed packages
import { anthropic, claude35Sonnet, claude35Haiku } from "genkitx-anthropic";
import { ollama } from "genkitx-ollama";
import { openAI } from "@genkit-ai/compat-oai/openai";

// Load environment variables from .env file
dotenv.config();

// Helper function to configure the model based on environment variables
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
function configureModel(): any {
  const provider = process.env.MODEL_PROVIDER || "google";
  const modelName = process.env.MODEL_NAME || "gemini-2.5-flash";
  const temperature = parseFloat(process.env.MODEL_TEMPERATURE || "0.7");

  switch (provider.toLowerCase()) {
    case "google":
      // Configure Google AI with API key if provided
      if (process.env.GOOGLE_API_KEY) {
        return googleAI.model(modelName, {
          apiKey: process.env.GOOGLE_API_KEY,
          temperature,
        });
      } else {
        return googleAI.model(modelName, { temperature });
      }

    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is required when using OpenAI provider"
        );
      }
      return openAI.model(modelName, {
        apiKey: process.env.OPENAI_API_KEY,
        temperature,
      });

    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          "ANTHROPIC_API_KEY is required when using Anthropic provider"
        );
      }

      switch (modelName) {
        case "claude-3-5-sonnet":
          return claude35Sonnet;
        case "claude-3-5-haiku":
          return claude35Haiku;
        default:
          logger.warn(
            `Unknown Anthropic model '${modelName}', falling back to claude-3-5-sonnet`
          );
          return claude35Sonnet;
      }

    case "ollama": {
      const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
      return ollama.model(modelName, {
        baseURL: ollamaUrl,
        temperature,
      });
    }

    default:
      logger.warn(`Unknown provider '${provider}', falling back to Google AI`);
      return googleAI.model(modelName, { temperature });
  }
}

// Helper function to configure model provider plugins
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
function configureProviderPlugins(): any {
  const provider = process.env.MODEL_PROVIDER || "google";

  switch (provider.toLowerCase()) {
    case "google":
      return googleAI(
        process.env.GOOGLE_API_KEY
          ? { apiKey: process.env.GOOGLE_API_KEY }
          : undefined
      );

    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is required when using OpenAI provider"
        );
      }
      return openAI({ apiKey: process.env.OPENAI_API_KEY });

    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          "ANTHROPIC_API_KEY is required when using Anthropic provider"
        );
      }
      return anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    case "ollama": {
      const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
      return ollama({ serverAddress: ollamaUrl });
    }

    default:
      logger.warn(`Unknown provider '${provider}', falling back to Google AI`);
      return googleAI(
        process.env.GOOGLE_API_KEY
          ? { apiKey: process.env.GOOGLE_API_KEY }
          : undefined
      );
  }
}

// Get model configuration
const modelConfig = ((): ReturnType<typeof configureModel> => {
  try {
    return configureModel();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- what would marius do
  } catch (error: any) {
    // Type assertion for error
    logger.error(
      `Error configuring model: ${error?.message || "Unknown error"}`
    );
    // Fall back to Google AI with default settings
    return googleAI.model("gemini-2.5-flash", { temperature: 0.7 });
  }
})();

// Configure Galaxy MCP client
export const galaxyMcpClient = mcpClient({
  name: "galaxy",
  serverProcess: {
    args: ["galaxy-mcp"],
    command: "uvx",
    cwd:
      process.env.GALAXY_MCP_PATH ||
      "/home/dcallan-adm/Documents/brc-analytics/galaxy-mcp",
  },
});

// Create the AI instance with the configured model and MCP client
export const ai = genkit({
  model: modelConfig,
  plugins: [
    // Configure your model provider based on environment variables
    configureProviderPlugins(),
    galaxyMcpClient,
  ],
});

// Set logging level (useful for debugging)
logger.setLogLevel("debug");
