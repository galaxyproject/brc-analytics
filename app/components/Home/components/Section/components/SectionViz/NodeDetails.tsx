import React from "react";

interface TreeNode {
  children?: TreeNode[];
  name: string;
  depth: number;
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

const TAXANOMIC_LEVELS_FOR_TREE = [
  "superkingdom",
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "strain",
];

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  const leafNodeCount = countLeafNodes(node);
  const taxonomicLevel = TAXANOMIC_LEVELS_FOR_TREE[node.depth] || "Unknown";
  const isRoot = node.depth === 0;

  if (isRoot) {
    return (
      <div>
        <p style={{ fontSize: "1.1em", color: "#666" }}>
          Click the visualization to explore available assemblies
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3>
        {node.data.name} <em>({taxonomicLevel})</em>
      </h3>
      <p>Available Assemblies: {leafNodeCount}</p>
    </div>
  );
};
