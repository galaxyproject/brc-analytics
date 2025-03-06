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
    "superkingdom": "taxonomicLevelSuperkingdom",
    "kingdom": "taxonomicLevelKingdom",
    "phylum": "taxonomicLevelPhylum",
    "class": "taxonomicLevelClass",
    "order": "taxonomicLevelOrder",
    "family": "taxonomicLevelFamily",
    "genus": "taxonomicLevelGenus",
    "species": "taxonomicLevelSpecies"
  };
  
  const categoryKey = rankMap[rank.toLowerCase()] || "taxonomicLevelGenus";
  
  // Create the filter object
  const filter = [
    {
      categoryKey,
      value: [name]
    }
  ];
  
  // Encode the filter as a URL parameter
  return `/data/assemblies?filter=${encodeURIComponent(JSON.stringify(filter))}`;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node, onClose }) => {
  const leafNodeCount = node ? countLeafNodes(node) : 0;
  const isRoot = node?.depth === 0;
  
  // Get node name and rank safely
  const nodeName = node?.data?.name || "Unknown";
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>
          {nodeName} {nodeRank !== "Unknown" && <em>({nodeRank})</em>}
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: '#666'
            }}
          >
            ×
          </button>
        )}
      </div>
      <p>Available Assemblies: {leafNodeCount}</p>
      {filterUrl && (
        <p>
          <a
            href={filterUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View All Assemblies →
          </a>
        </p>
      )}
    </div>
  );
};
