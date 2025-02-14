import data from "catalog/output/ncbi-taxa-tree.json";

interface TreeNode {
  children: TreeNode[];
  name: string;
}

export function getData(): TreeNode {
  // Any data massaging can be done at this extension point.
  return data;
}
