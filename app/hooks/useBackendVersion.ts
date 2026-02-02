import { useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

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
    if (!BACKEND_URL) {
      return;
    }
    fetch(`${BACKEND_URL}/api/v1/version`)
      .then((res) => res.json())
      .then((data: BackendVersion) => setVersion(data.version))
      .catch(() => setVersion(null)); // Gracefully handle backend unavailable
  }, []);

  return version;
}
