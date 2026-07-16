import { createContext } from "react";
import { HandoffStatus } from "./types";

/**
 * Context for in-flight handoff status. Provided by `WorkflowInputsView`
 * (the only page that mounts `useHandoffSync` today); other pages get the
 * default, so a shared component like `SequencingStep` rendered on those
 * pages reads a non-loading status without firing its own handoff query.
 */
export const HandoffStatusContext = createContext<HandoffStatus>({
  sequencing: { status: { isLoading: false } },
});
