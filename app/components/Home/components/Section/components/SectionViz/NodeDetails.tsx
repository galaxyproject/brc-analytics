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
          <h4>Useful info about {node.data.name}</h4>
          <ul>
            <li>Number of entities</li>
            <li>Quick links</li>
            <li>....</li>
          </ul>
        </div>
      ) : (
        <p>No children</p>
      )}
    </div>
  );
};
