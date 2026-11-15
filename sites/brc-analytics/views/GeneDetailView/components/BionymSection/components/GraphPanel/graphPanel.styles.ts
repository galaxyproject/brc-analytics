import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { bpDown1024 } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

// The network, with the detail panel beside it, or under it on a narrow
// screen.
export const GraphLayout = styled.div`
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) 320px;

  ${bpDown1024} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const NetworkToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

// findable-ui's bordered, rounded card, kept to its content's height rather
// than stretched to the network's.
export const DetailPanel = styled(RoundedPaper)`
  align-self: start;
  display: grid;
  gap: 8px;
  overflow-wrap: anywhere;
  padding: 12px 16px;
`;

// A node such as the gene itself can have hundreds of edges, so the list
// scrolls within the panel.
export const EdgeList = styled.ul`
  display: grid;
  gap: 4px;
  margin: 0;
  max-height: 480px;
  overflow-y: auto;
  padding-left: 0;
  list-style: none;
`;

export const HiddenTypes = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const SwitchGrid = styled.div`
  display: grid;
  gap: 0 16px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
`;
