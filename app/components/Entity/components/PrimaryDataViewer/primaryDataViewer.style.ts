import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";

import styled from "@emotion/styled";
import { smokeLightest } from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";

export const StyledSection = styled(GridPaperSection)`
    flex-direction: column;
    gap: 16px;
`;

export const SectionContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
        width: 600px;
        height: 600px;
    }
`;

export const BlinkingDots = styled.span`
    font-weight: bold;
    @keyframes blink {
        0% { opacity: 1; }
        33% { opacity: 0; }
        66% { opacity: 0; }
        100% { opacity: 1; }
    }
    .dot:nth-child(1) {
        animation: blink 1.5s infinite;
    }
    .dot:nth-child(2) {
        animation: blink 1.5s infinite 0.5s;
    }
    .dot:nth-child(3) {
        animation: blink 1.5s infinite 1s;
    }
`;
