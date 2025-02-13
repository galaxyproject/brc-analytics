import React from "react";

interface NodeDetailsProps {
  node: {
    children?: Array<{
      data: {
        name: string;
      };
    }>;
    data: {
      name: string;
    };
  };
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.name}</h3>
      {node.children && node.children.length > 0 ? (
        <div>
          <h4>Display info about..</h4>
          <ul>
            <li>...</li>
            <li>.....</li>
            <li>....</li>
          </ul>
        </div>
      ) : (
        <p>No children</p>
      )}
    </div>
  );
};
