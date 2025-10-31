import { CircularProgress, Link, Typography } from "@mui/material";
import { Fragment, useState } from "react";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ResourceItem } from "app/apis/catalog/ga2/entities";

export interface AnalysisResourcesProps {
  resources: Record<string, Array<ResourceItem>>;
}

export const AnalysisResources = ({
  resources,
}: AnalysisResourcesProps): JSX.Element => {
  const [downloading, setDownloading] = useState<string | null>(null);

  /**
   * Detects the user's operating system.
   * @returns {"bash" | "powershell"} - Script type based on OS
   */
  const detectOS = (): "bash" | "powershell" => {
    // Check if running in browser (not SSR)
    if (typeof window === "undefined") {
      return "bash"; // Default to bash for server-side rendering
    }
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("win") ? "powershell" : "bash";
  };

  /**
   * Generates a bash script to download files into a folder (Linux/macOS).
   * @param {string[]} files - Array of remote file URLs to download
   * @param {string} archiveName - Name for the output folder
   * @returns {string} - Bash script content
   */
  const generateBashScript = (files: string[], archiveName: string): string => {
    const sanitizedName = archiveName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const scriptLines = [
      "#!/bin/bash",
      "",
      "# Download script for " + archiveName,
      "# This script downloads files into a folder",
      "# Compatible with Linux and macOS",
      "",
      "set -e  # Exit on error",
      "",
      "# Create output directory",
      `OUTPUT_DIR="${sanitizedName}"`,
      'mkdir -p "$OUTPUT_DIR"',
      'echo "Downloading files to $OUTPUT_DIR..."',
      "",
    ];

    files.forEach((fileUrl, index) => {
      const fileName = fileUrl.split("/").pop() || `file_${index}`;
      scriptLines.push(`echo "Downloading ${fileName}..."`);
      scriptLines.push(
        `curl -L -o "$OUTPUT_DIR/${fileName}" "${fileUrl}" 2>/dev/null`
      );
    });

    scriptLines.push("", `echo "Done! Files saved to $OUTPUT_DIR/"`, "");

    return scriptLines.join("\n");
  };

  /**
   * Generates a PowerShell script to download files into a folder (Windows).
   * @param {string[]} files - Array of remote file URLs to download
   * @param {string} archiveName - Name for the output folder
   * @returns {string} - PowerShell script content
   */
  const generatePowerShellScript = (
    files: string[],
    archiveName: string
  ): string => {
    const sanitizedName = archiveName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const scriptLines = [
      "# Download script for " + archiveName,
      "# This script downloads files into a folder",
      "# Compatible with Windows PowerShell",
      "",
      "$ErrorActionPreference = 'Stop'",
      "",
      "# Create output directory",
      `$OutputDir = "${sanitizedName}"`,
      "New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null",
      'Write-Host "Downloading files to $OutputDir..."',
      "",
    ];

    files.forEach((fileUrl, index) => {
      const fileName = fileUrl.split("/").pop() || `file_${index}`;
      scriptLines.push(`Write-Host "Downloading ${fileName}..."`);
      scriptLines.push(
        `Invoke-WebRequest -Uri "${fileUrl}" -OutFile "$OutputDir\\${fileName}"`
      );
    });

    scriptLines.push("", 'Write-Host "Done! Files saved to $OutputDir\\"', "");

    return scriptLines.join("\n");
  };

  /**
   * Creates and downloads a script for downloading folder resources.
   * @param {string[]} files - Array of remote file URLs to include in script
   * @param {string} archiveName - Name for the downloaded script and folder
   * @param {"bash" | "powershell"} scriptType - Type of script to generate
   * @returns {void}
   */
  const handleFolderDownload = (
    files: string[],
    archiveName: string,
    scriptType: "bash" | "powershell"
  ): void => {
    setDownloading(`${archiveName}_${scriptType}`);
    try {
      const sanitizedName = archiveName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const scriptContent =
        scriptType === "bash"
          ? generateBashScript(files, archiveName)
          : generatePowerShellScript(files, archiveName);

      const blob = new Blob([scriptContent], {
        type: scriptType === "bash" ? "text/x-shellscript" : "text/plain",
      });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download =
        scriptType === "bash"
          ? `download_${sanitizedName}.sh`
          : `download_${sanitizedName}.ps1`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating download script:", error);
      alert("Failed to create download script. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  /**
   * Renders a resource link based on its type.
   * @param {ResourceItem} resource - The resource to render
   * @returns {JSX.Element | null} - Rendered resource link or null
   */
  const renderResourceLink = (resource: ResourceItem): JSX.Element | null => {
    if (resource.type === "file" && resource.url) {
      return <Link href={resource.url}>{resource.name}</Link>;
    }

    if (resource.type === "folder" && resource.files) {
      const scriptType = detectOS();
      const isDownloading = downloading === `${resource.name}_${scriptType}`;

      return (
        <>
          <Link
            component="button"
            onClick={() =>
              handleFolderDownload(resource.files!, resource.name, scriptType)
            }
            sx={{ cursor: "pointer" }}
          >
            {resource.name}
          </Link>
          {isDownloading && <CircularProgress size={12} sx={{ ml: 1 }} />}
        </>
      );
    }

    return null;
  };

  if (Object.keys(resources).length === 0) return <Fragment></Fragment>;

  return (
    <>
      {Object.keys(resources).map((resourceType) => (
        <Fragment key={resourceType}>
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
            component="h3"
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
          >
            {resourceType}
          </Typography>
          {resources[resourceType].map((resource) => (
            <Typography
              key={resource.name}
              variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
            >
              {renderResourceLink(resource)}
            </Typography>
          ))}
        </Fragment>
      ))}
    </>
  );
};
