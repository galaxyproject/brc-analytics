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

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  const leafNodeCount = countLeafNodes(node);
  const isRoot = node.depth === 0;

  if (isRoot) {
    return (
      <div>
        <p style={{ color: "#666", fontSize: "1.1em" }}>
          Click the visualization to explore available assemblies
        </p>
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
