import {
  Card as MuiCard,
  CardMedia as MuiCardMedia,
  IconButton as MuiIconButton,
  Link,
  Typography,
  Tooltip as MuiTooltip,
} from "@mui/material";
import styled from "@emotion/styled";

export const Card = styled(MuiCard)`
  &.MuiCard-root {
    background-color: transparent;
    position: relative;
  }
`;

export const CardMedia = styled(MuiCardMedia)`
  &.MuiCardMedia-root {
    height: 350px;
  }
`;

export const Thumbnail = styled.img`
  height: 40px;
  width: 40px;
  border-radius: 20%;
  object-fit: cover;
`;

export const Details = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(255, 255, 255, 1);
  border-radius: 50%;
  display: flex;
`;

export const Detail = styled(Typography)`
  &.MuiTypography-root {
    font-size: 12px;
    line-height: 1.5;
  }
`;

export const SourceLink = styled(Link)`
  &.MuiLink-root {
    font-size: 12px;
    display: block;
    height: auto;
  }
`;

export const Tooltip = styled(MuiTooltip)`
  .MuiTooltip-tooltip {
    background-color: rgba(0, 0, 0, 0.8);
    font-size: 10px;
    padding: 8px;
    border-radius: 4px;
  }
`;

export const IconButton = styled(MuiIconButton)`
  & {
    padding: 0;
  }
`;
