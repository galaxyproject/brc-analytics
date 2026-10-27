import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { Link as DXLink } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import {
  ArrowBackRounded,
  ChevronRightRounded,
  ViewListOutlined,
} from "@mui/icons-material";
import React, { type JSX } from "react";
import { type TreeNode } from "./types";
import { createFilterUrl } from "./utils";

interface NodeDetailsProps {
  node: TreeNode;
  onClose?: () => void;
  onNodeClick?: (node: TreeNode) => void;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({
  node,
  onClose,
  onNodeClick,
}): JSX.Element => {
  const isRoot = node?.depth === 0;

  // Get node name and rank safely
  const nodeName = node?.data?.name || "Unknown";
  const nodeRank = node?.data?.rank || "Unknown";

  // Get first-level children for navigation
  const firstLevelChildren = node?.children || [];

  // Create the filter URL for this node if possible
  const filterUrl = createFilterUrl(nodeRank, nodeName);
  // Fallback URL to the main assemblies page
  const linkUrl = filterUrl || "/data/assemblies";

  // Create the appropriate display text based on node type
  let filterLinkText = "Browse All Assemblies";
  if (!isRoot) {
    const assemblyCount = node.data.assembly_count;
    const assemblySuffix = assemblyCount > 1 ? "ies" : "y";
    filterLinkText = `View ${assemblyCount} Assembl${assemblySuffix} for ${nodeName}`;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      <div style={{ flex: "1", marginTop: "20px" }}>
        <RoundedPaper>
          <div
            style={{
              alignItems: "center",
              borderBottom: "1px solid #e0e0e0",
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
              display: "flex",
              padding: "12px 16px",
            }}
          >
            <ViewListOutlined style={{ marginRight: "8px" }} />
            <DXLink label={filterLinkText} url={linkUrl} />
          </div>

          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
              padding: "16px 16px 8px 16px",
            }}
          >
            <h4
              style={{
                color: "#000",
                fontFamily: "'Inter Tight', sans-serif",
                fontSize: "20px",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Subcategories
            </h4>

            {!isRoot && (onNodeClick || onClose) && (
              <div
                onClick={() => {
                  // Navigate to parent node
                  if (node.parent && onNodeClick) {
                    onNodeClick(node.parent as TreeNode);
                  } else if (onClose) {
                    // Fallback to onClose if parent is not available
                    onClose();
                  }
                }}
                style={{
                  alignItems: "center",
                  cursor: "pointer",
                  display: "flex",
                  padding: "4px",
                }}
              >
                <ArrowBackRounded style={{ color: "#666" }} fontSize="small" />
              </div>
            )}
          </div>

          <div>
            {(firstLevelChildren as TreeNode[]).map((child, index) => (
              <div
                key={index}
                onClick={() => onNodeClick && onNodeClick(child)}
                style={{
                  alignItems: "center",
                  borderTop: "1px solid #eee",
                  color: "#000",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{child.data.name}</span>
                  <span
                    style={{
                      color: "#666",
                      fontSize: "0.9em",
                      marginLeft: "8px",
                    }}
                  >
                    ({child.data.assembly_count})
                  </span>
                </div>
                <ChevronRightRounded style={{ color: "#666" }} />
              </div>
            ))}
          </div>
        </RoundedPaper>
      </div>

      {isRoot && (
        <p
          style={{
            color: "#666",
            fontSize: "0.9em",
            fontStyle: "italic",
            marginTop: "auto",
            textAlign: "right",
          }}
        >
          Click the visualization to explore available assemblies, or make a
          selection above.
        </p>
      )}
    </div>
  );
};
