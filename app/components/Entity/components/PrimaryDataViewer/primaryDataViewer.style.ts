import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";

import styled from "@emotion/styled";

export const StyledSection = styled(GridPaperSection)`
  flex-direction: column;
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
    0% {
      opacity: 1;
    }
    33% {
      opacity: 0;
    }
    66% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
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

export const ReactPageNation = styled.span`
  /* General container styling */
  .container {
    max-width: 800px;
    margin: 50px auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    font-family: "Arial", sans-serif;
  }

  /* Blog posts list styling */
  .list-group-item {
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
    transition: box-shadow 0.3s ease;
  }

  .list-group-item p {
    color: #666;
    line-height: 1.6;
  }

  /* Pagination styling */
  .pagination {
    display: flex;
    justify-content: center;
    padding: 0px;

    list-style: none;
  }

  .pagination li {
    margin: 0 1px;
    font-size: 0.7rem;
  }

  .pagination li a {
    display: inline-block;
    padding: 5px 10px 5px 10px;
    background-color: white;
    color: #212b36;
    border-radius: 5px;
    text-decoration: none;
    transition:
      background-color 0.3s ease,
      color 0.3s ease;
  }

  .pagination li a:hover {
    background-color: #212b36;
    color: white;
  }

  .pagination li.active a {
    border-color: #212b36;
    border-style: dashed;
    border-width: 1px;
  }
`;
