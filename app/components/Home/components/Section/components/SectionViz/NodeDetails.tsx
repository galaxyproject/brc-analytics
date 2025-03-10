import React from "react";

export interface TreeNode {
  children?: TreeNode[];
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
  const leafNodeCount = node ? countLeafNodes(node) : 0;
  const isRoot = node?.depth === 0;

  // Get node name and rank safely
  const nodeName = node?.data?.name || node?.name || "Unknown";
  const nodeRank = node?.data?.rank || "Unknown";

  if (isRoot) {
    // Get first-level children for navigation
    const firstLevelChildren = node?.children || [];

    return (
      <div>
        <p style={{ color: "#666", fontSize: "1.1em" }}>
          Click the visualization to explore available assemblies
        </p>

        {firstLevelChildren.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h4>Quick Navigation:</h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {firstLevelChildren.map((child, index) => (
                <li
                  key={index}
                  onClick={() => onNodeClick && onNodeClick(child)}
                  style={{
                    padding: "6px 0",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    color: "#0066cc",
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
  }

  return (
    <div>
      <h3>
        {node.data.name} <em>({node.data.rank})</em>
      </h3>
      <p>Available Assemblies: {leafNodeCount}</p>
      {node.height == 0 && node.data.ncbi_tax_id && (
        <>
          <p>NCBI Taxonomy ID: {node.data.ncbi_tax_id}</p>
          <p>
            <a
              href={`/data/organisms/${node.data.ncbi_tax_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Organism Page →
            </a>
          </p>
        </>
      )}
    </div>
  );
};
