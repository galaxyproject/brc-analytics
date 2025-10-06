"use client";

import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

const CLIENT_VERSION = process.env.NEXT_PUBLIC_VERSION || "0.15.0";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const VersionDisplay = (): JSX.Element => {
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!BACKEND_URL) {
      // No backend URL configured, skip fetching
      return;
    }

    fetch(`${BACKEND_URL}/api/v1/version`)
      .then((res) => res.json())
      .then((data) => setBackendVersion(data.version))
      .catch(() => setBackendVersion(null)); // Gracefully handle backend unavailable
  }, []);

  return (
    <Typography
      color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
    >
      Client build: {CLIENT_VERSION}
      {backendVersion && ` • Server revision: ${backendVersion}`}
    </Typography>
  );
};
