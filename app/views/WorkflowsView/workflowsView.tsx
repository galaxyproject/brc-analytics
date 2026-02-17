import React, { JSX, useMemo } from "react";
import { ExploreView } from "../ExploreView/exploreView";
import { Workflows } from "./components/Workflows/workflows";
import { Props } from "./types";
import { getWorkflows } from "./utils";

/**
 * WorkflowsView renders the main view for exploring workflows,
 * utilizing the ExploreView component to provide filtering and layout.
 * @param props - Props.
 * @param props.data - Workflows data.
 * @returns Workflows view.
 */
export const WorkflowsView = (props: Props): JSX.Element => {
  const { data } = props;

  const workflows = useMemo(() => getWorkflows(data.hits), [data]);

  return <ExploreView data={workflows} Component={Workflows} />;
};
