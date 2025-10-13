import { styled } from "@mui/material";

export const StyledCodeBlock = styled("pre")(({ theme }) => ({
  "& code": {
    display: "block",
    fontFamily: "inherit",
    whiteSpace: "pre",
  },
  "&::-webkit-scrollbar": {
    height: 8,
    width: 8,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[700],
    borderRadius: 4,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.grey[800],
  },
  backgroundColor: theme.palette.grey[900],
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.common.white,
  fontFamily: "monospace",
  fontSize: "0.875rem",
  lineHeight: 1.5,
  margin: theme.spacing(2, 0),
  overflow: "auto",
  padding: theme.spacing(2),
  position: "relative",
}));

export const StyledLanguageTag = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  color: theme.palette.primary.contrastText,
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: 0.5,
  padding: theme.spacing(0.5, 1),
  position: "absolute",
  right: 10,
  textTransform: "uppercase",
  top: 0,
}));
