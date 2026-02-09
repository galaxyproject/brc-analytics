"use client";

import { Box, Tooltip } from "@mui/material";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import { JSX, useEffect, useState } from "react";
import { VersionInfo } from "@databiosphere/findable-ui/lib/components/Layout/components/Footer/components/VersionInfo/versionInfo";
import { API_BASE_URL } from "../../../../../../config/api";

export const VersionInfoWithServerStatus = (): JSX.Element => {
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/version`)
      .then((res) => res.json())
      .then((data) => setBackendVersion(data.version))
      .catch(() => setBackendVersion(null));
  }, []);

  const connected = backendVersion !== null;
  const label = connected ? `API: ${backendVersion}` : "API: unavailable";

  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
      <VersionInfo />
      <Tooltip arrow title={label}>
        <DnsOutlinedIcon
          sx={{
            color: connected ? "action.disabled" : "error.main",
            cursor: "default",
            fontSize: 16,
          }}
        />
      </Tooltip>
    </Box>
  );
};
