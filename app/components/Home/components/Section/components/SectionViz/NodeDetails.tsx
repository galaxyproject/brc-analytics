import React from "react";

export interface TreeNode {
  children?: TreeNode[];
  current?: boolean;
  data: {
    name: string;
    ncbi_tax_id?: number;
    rank: string;
  };
  depth: number;
  height: number;
  name: string;
}

interface NodeDetailsProps {
  node: TreeNode;
  onClose?: () => void;
  onNodeClick?: (node: TreeNode) => void;
}

function countLeafNodes(node: TreeNode): number {
  if (!node.children || node.children.length === 0) {
    return 1;
  }

  let count = 0;
  for (const child of node.children) {
    count += countLeafNodes(child);
  }
  return count;
}

// Helper function to create a filter URL based on taxonomic level and name
function createFilterUrl(rank?: string, name?: string): string | null {
  // If rank or name is missing, we can't create a filter
  if (!rank || !name) {
    return null;
  }

  // Convert rank to the expected format for the filter
  const rankMap: Record<string, string> = {
    class: "taxonomicLevelClass",
    family: "taxonomicLevelFamily",
    genus: "taxonomicLevelGenus",
    kingdom: "taxonomicLevelKingdom",
    order: "taxonomicLevelOrder",
    phylum: "taxonomicLevelPhylum",
    species: "taxonomicLevelSpecies",
    superkingdom: "taxonomicLevelSuperkingdom",
  };

  const categoryKey = rankMap[rank.toLowerCase()] || "taxonomicLevelGenus";

  // Create the filter object
  const filter = [
    {
      categoryKey,
      value: [name],
    },
  ];

  // Encode the filter as a URL parameter
  return `/data/assemblies?filter=${encodeURIComponent(JSON.stringify(filter))}`;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({
  node,
  onClose,
  onNodeClick,
}): JSX.Element => {
  const isRoot = node?.depth === 0;

  // Get node name and rank safely
  const nodeName = node?.data?.name || node?.name || "Unknown";
  const nodeRank = node?.data?.rank || "Unknown";

  // Get first-level children for navigation
  const firstLevelChildren = node?.children || [];

  // Create the filter URL for this node if possible
  const filterUrl = createFilterUrl(nodeRank, nodeName);

  return (
    <div>
      {isRoot && (
        <p style={{ color: "#666" }}>
          Click the visualization to explore available assemblies, or select an
          option below.
        </p>
      )}

      {!isRoot && filterUrl && (
        <p>
          <a href={filterUrl} target="_blank" rel="noopener noreferrer">
            View {countLeafNodes(node)} Assemblie{countLeafNodes(node) > 1 ? 's' : ''} for {nodeName}
          </a>
        </p>
      )}

      {/* {!isRoot && onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      )} */}

      {firstLevelChildren.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h4>Subcategories</h4>
          <ul
            style={{
              listStyle: "none",
              maxHeight: "600px",
              overflowY: "auto",
              padding: 0,
            }}
          >
            {firstLevelChildren.map((child, index) => (
              <li
                key={index}
                onClick={() => onNodeClick && onNodeClick(child)}
                style={{
                  borderBottom: "1px solid #eee",
                  color: "#0066cc",
                  cursor: "pointer",
                  padding: "6px 0",
                }}
              >
                {child.name || child.data?.name}
                <span
                  style={{
                    color: "#888",
                    fontSize: "0.9em",
                    marginLeft: "5px",
                  }}
                >
                  ({countLeafNodes(child)} assemblies)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
