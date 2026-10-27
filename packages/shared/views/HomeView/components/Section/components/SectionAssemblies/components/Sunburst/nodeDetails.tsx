import { Link as DXLink } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import {
  ArrowBackRounded,
  ChevronRightRounded,
  ViewListOutlined,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { type JSX } from "react";
import {
  Hint,
  Lineage,
  LinkRow,
  List,
  ListHeader,
  Meta,
  Panel,
  PanelHeader,
  PanelPaper,
  RowButton,
  TextButton,
  Title,
} from "./sunburst.styles";
import { type TreeNode } from "./types";
import { createFilterUrl, formatAssemblyCount } from "./utils";

interface NodeDetailsProps {
  node: TreeNode;
  onNodeClick: (node: TreeNode) => void;
}

/**
 * Display name for a node; the tree's root is literally named "root".
 * @param node - Node to name.
 * @returns Its display name.
 */
function displayName(node: TreeNode): string {
  return node.depth === 0 ? "All taxa" : node.data.name;
}

/**
 * Details panel beside the sunburst: where the center sits in the lineage,
 * a link to its assemblies, and its children to zoom into.
 * @param props - Component props.
 * @param props.node - Node the chart is centred on.
 * @param props.onNodeClick - Zooms the chart to a node.
 * @returns The panel.
 */
export const NodeDetails = ({
  node,
  onNodeClick,
}: NodeDetailsProps): JSX.Element => {
  const isRoot = node.depth === 0;
  const nodeName = node.data.name;
  const children = (node.children ?? []) as TreeNode[];
  const lineage = (node.ancestors() as TreeNode[]).slice(1).reverse();
  const parent = node.parent as TreeNode | null;

  const linkUrl =
    createFilterUrl(node.data.rank, nodeName) || "/data/assemblies";
  let linkText = "Browse All Assemblies";
  if (!isRoot) {
    const count = node.data.assembly_count;
    linkText = `View ${count} Assembl${count > 1 ? "ies" : "y"} for ${nodeName}`;
  }

  return (
    <Panel>
      <PanelPaper>
        {!isRoot && (
          <PanelHeader>
            <nav aria-label="Lineage">
              <Lineage>
                {lineage.map((ancestor) => (
                  <li key={ancestor.data.ncbi_tax_id || ancestor.data.name}>
                    <TextButton
                      onClick={() => onNodeClick(ancestor)}
                      type="button"
                    >
                      {displayName(ancestor)}
                    </TextButton>
                  </li>
                ))}
              </Lineage>
            </nav>
            <Title>{nodeName}</Title>
            <Meta>
              {node.data.rank ? `${node.data.rank} · ` : ""}
              {formatAssemblyCount(node.data.assembly_count)}
            </Meta>
          </PanelHeader>
        )}
        <LinkRow>
          <ViewListOutlined fontSize="small" />
          <DXLink label={linkText} url={linkUrl} />
        </LinkRow>
        <ListHeader>
          <h4>Subcategories</h4>
          {parent && (
            <IconButton
              aria-label={`Back to ${displayName(parent)}`}
              onClick={() => onNodeClick(parent)}
              size="small"
            >
              <ArrowBackRounded fontSize="small" />
            </IconButton>
          )}
        </ListHeader>
        {children.length > 0 ? (
          <List>
            {children.map((child) => (
              <li key={child.data.ncbi_tax_id || child.data.name}>
                <RowButton onClick={() => onNodeClick(child)} type="button">
                  <span>
                    <span className="name">{child.data.name}</span>
                    <span className="count">({child.data.assembly_count})</span>
                  </span>
                  <ChevronRightRounded />
                </RowButton>
              </li>
            ))}
          </List>
        ) : (
          <Hint style={{ padding: "0 16px 16px" }}>
            No further subcategories.
          </Hint>
        )}
      </PanelPaper>
      {isRoot && (
        <Hint>
          Click the visualization to explore available assemblies, or make a
          selection above.
        </Hint>
      )}
    </Panel>
  );
};
