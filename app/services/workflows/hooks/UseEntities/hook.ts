import { useEffect, useState } from "react";
import { ensureEntitiesLoaded } from "./utils";
import { getConfig } from "@databiosphere/findable-ui/lib/config/config";

export function useEntities(): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  const config = getConfig();

  useEffect(() => {
    if (!config) return;

    ensureEntitiesLoaded(config)
      .then(() => setIsLoaded(true))
      .catch((err) => {
        throw new Error("Failed to load entities", err);
      });
  }, [config]);

  return isLoaded;
}
