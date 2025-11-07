/**
 * Utility functions for JBrowse component.
 */

/**
 * Check if a URL is a remote URL (http/https) or local path.
 * @param url - URL or path to check.
 * @returns True if the URL is remote (starts with http:// or https://), false otherwise.
 */
export function isRemoteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Validate that a JBrowse config URL is properly formed.
 * @param url - URL or path to validate.
 * @returns True if URL is valid, false otherwise.
 */
export function isValidConfigUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Check if it's a remote URL
  if (isRemoteUrl(url)) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Check if it's a local path (should start with /)
  return url.startsWith("/");
}

/**
 * Load JBrowse configuration from a URL or local path.
 * @param configUrl - URL or path to the JBrowse config file.
 * @returns Promise resolving to the configuration object.
 */
export async function loadJBrowseConfig(
  configUrl: string
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(configUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to load JBrowse config: ${response.status} ${response.statusText}`
      );
    }

    const config = await response.json();
    return config;
  } catch (error) {
    console.error("Error loading JBrowse config:", error);
    throw error;
  }
}

/**
 * Generate a default error message for missing or invalid config.
 * @param accession - Assembly accession.
 * @param error - Optional error object.
 * @returns Error message string.
 */
export function getConfigErrorMessage(
  accession: string,
  error?: Error
): string {
  if (error) {
    return `Failed to load JBrowse configuration for assembly ${accession}: ${error.message}`;
  }
  return `JBrowse configuration not available for assembly ${accession}`;
}

/**
 * Convert full JBrowse config to React Linear Genome View format.
 * Handles both formats: full JBrowse config and React LGV config.
 * @param config - JBrowse configuration object.
 * @returns Configuration in React Linear Genome View format.
 */
export function convertToLinearGenomeViewConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Config structure varies
  config: any
): Record<string, unknown> {
  // If it's already in React LGV format (has singular 'assembly'), return as-is
  if (config.assembly && config.defaultSession?.view) {
    return config;
  }

  // If it's a full JBrowse config (has plural 'assemblies'), convert it
  if (config.assemblies && Array.isArray(config.assemblies)) {
    const firstAssembly = config.assemblies[0];
    const firstView = config.defaultSession?.views?.[0];

    if (!firstAssembly) {
      throw new Error("Config has no assemblies");
    }

    return {
      assembly: firstAssembly,
      configuration: config.configuration,
      defaultSession: {
        name: config.defaultSession?.name || "Default Session",
        view: firstView
          ? {
              id: "linearGenomeView",
              type: "LinearGenomeView",
              ...firstView.init,
            }
          : {
              id: "linearGenomeView",
              type: "LinearGenomeView",
            },
      },
      tracks: config.tracks || [],
    };
  }

  throw new Error("Invalid JBrowse configuration format");
}
