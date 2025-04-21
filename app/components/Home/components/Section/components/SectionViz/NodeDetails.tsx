import React from "react";
import { TaxonomyNode } from "./data";
import { HierarchyNode } from "d3";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { ChevronRightRounded } from "@mui/icons-material";

// Define additional properties used by D3 during transitions
interface D3TransitionNode {
  current: {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  };
  target: {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  };
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

// Define a type that represents a d3 hierarchy node with taxonomy data
// and additional properties used during transitions
export type TreeNode = HierarchyNode<TaxonomyNode> & D3TransitionNode;

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

  /* eslint-disable sort-keys -- Keep these in natural order of hierarchy */
  // Convert rank to the expected format for the filter
  const rankMap: Record<string, string> = {
    strain: "taxonomicLevelStrain",
    species: "taxonomicLevelSpecies",
    genus: "taxonomicLevelGenus",
    family: "taxonomicLevelFamily",
    order: "taxonomicLevelOrder",
    class: "taxonomicLevelClass",
    phylum: "taxonomicLevelPhylum",
    kingdom: "taxonomicLevelKingdom",
    domain: "taxonomicLevelDomain",
    realm: "taxonomicLevelRealm",
  };
  /* eslint-enable sort-keys -- re-enable sort keys */

  const categoryKey = rankMap[rank.toLowerCase()] || null;

  // If we couldn't map the rank, we can't create a filter
  if (!categoryKey) {
    return null;
  }

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

// Helper function to determine child taxa classification
function getChildTaxonRank(node: TreeNode): string {
  if (!node?.children?.length) return "Subcategories";

  // Get rank of first child with a rank defined
  const firstChildWithRank = node.children.find((child) => child.data?.rank);
  if (!firstChildWithRank) return "Subcategories";

  const rank = firstChildWithRank.data.rank?.toLowerCase();

  // Create plural form based on rank
  switch (rank) {
    case "domain":
      return "Domains";
    case "realm":
      return "Realms";
    case "kingdom":
      return "Kingdoms";
    case "phylum":
      return "Phyla";
    case "class":
      return "Classes";
    case "order":
      return "Orders";
    case "family":
      return "Families";
    case "genus":
      return "Genera";
    case "species":
      return "Species";
    case "strain":
      return "Strains";
    default:
      return rank
        ? `${rank.charAt(0).toUpperCase() + rank.slice(1)}s`
        : "Subcategories";
  }
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

  // Get child taxa classification
  const childTaxaClassification = getChildTaxonRank(node);

  // Create the filter URL for this node if possible
  const filterUrl = createFilterUrl(nodeRank, nodeName);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      {!isRoot && filterUrl && (
        <p>
          <a href={filterUrl} rel="noopener noreferrer">
            View {countLeafNodes(node)} Assembl
            {countLeafNodes(node) > 1 ? "ies" : "y"} for {nodeName}
          </a>
        </p>
      )}

      {!isRoot && onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
            fontSize: "20px",
            padding: "5px",
            position: "absolute",
            right: "0",
            top: "0",
          }}
        >
          ×
        </button>
      )}

      {isRoot && (
        <div style={{ flex: "1" }}>
          <RoundedPaper>
            <div style={{ padding: "16px 16px 8px 16px" }}>
              <h4
                style={{
                  color: "#000",
                  fontFamily: "'Inter Tight', sans-serif",
                  fontSize: "20px",
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                Categories
              </h4>
            </div>

            <div>
              {firstLevelChildren.map((child, index) => (
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
                    padding: "8px 16px",
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
                      ({countLeafNodes(child)})
                    </span>
                  </div>
                  <ChevronRightRounded style={{ color: "#666" }} />
                </div>
              ))}
            </div>
          </RoundedPaper>
        </div>
      )}

      {!isRoot && firstLevelChildren.length > 0 && (
        <div style={{ flex: "1", marginTop: "20px" }}>
          <RoundedPaper>
            <div style={{ padding: "16px 16px 8px 16px" }}>
              <h4
                style={{
                  color: "#000",
                  fontFamily: "'Inter Tight', sans-serif",
                  fontSize: "20px",
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {childTaxaClassification}
              </h4>
            </div>

            <div>
              {firstLevelChildren.map((child, index) => (
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
                      ({countLeafNodes(child)})
                    </span>
                  </div>
                  <ChevronRightRounded style={{ color: "#666" }} />
                </div>
              ))}
            </div>
          </RoundedPaper>
        </div>
      )}

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
