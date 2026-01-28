import { useEffect, useState } from "react";

interface BackendVersion {
  environment: string;
  service: string;
  version: string;
}

/**
 * Hook to fetch backend version with graceful fallback.
 * @returns Backend version string or null if backend is unavailable.
 */
export function useBackendVersion(): string | null {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/version")
      .then((res) => res.json())
      .then((data: BackendVersion) => setVersion(data.version))
      .catch(() => setVersion(null)); // Gracefully handle backend unavailable
  }, []);

  return version;
}
