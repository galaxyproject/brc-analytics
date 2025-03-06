import React from "react";

export interface TreeNode {
  children?: TreeNode[];
  data?: {
    name?: string;
    ncbi_tax_id?: number;
    rank?: string;
  };
  depth?: number;
  height?: number;
  name?: string;
  value?: number;
}

interface NodeDetailsProps {
  node: TreeNode;
  onClose?: () => void;
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
}): JSX.Element => {
  const leafNodeCount = node ? countLeafNodes(node) : 0;
  const isRoot = node?.depth === 0;

  // Get node name and rank safely
  const nodeName = node?.data?.name || node?.name || "Unknown";
  const nodeRank = node?.data?.rank || "Unknown";

  if (isRoot) {
    return (
      <div>
        <p style={{ color: "#666", fontSize: "1.1em" }}>
          Click the visualization to explore available assemblies
        </p>
      </div>
    );
  }

  // Create the filter URL for this node if possible
  const filterUrl = createFilterUrl(nodeRank, nodeName);

  return (
    <div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h3>
          {nodeName} {nodeRank !== "Unknown" && <em>({nodeRank})</em>}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            ×
          </button>
        )}
      </div>
      <p>Available Assemblies: {leafNodeCount}</p>
      {node?.value !== undefined && <p>Number of Organisms: {node.value}</p>}
      {node?.height === 0 && node?.data?.ncbi_tax_id && (
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
      {filterUrl && (
        <p>
          <a href={filterUrl} target="_blank" rel="noopener noreferrer">
            View All Assemblies →
          </a>
        </p>
      )}
    </div>
  );
};
