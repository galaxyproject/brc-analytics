import { styled } from "@mui/material";

export const StyledDocSidebar = styled("aside")(({ theme }) => ({
  "& .category-title": {
    "&:first-of-type": {
      marginTop: 0,
    },
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
    fontWeight: 600,
    letterSpacing: "0.5px",
    marginBottom: theme.spacing(1.5),
    marginTop: theme.spacing(3),
    padding: theme.spacing(0, 1),
    textTransform: "uppercase",
  },
  "& .item": {
    "&.active": {
      "& .item-icon": {
        color: theme.palette.primary.main,
      },
      "&::before": {
        backgroundColor: theme.palette.primary.main,
        borderBottomLeftRadius: theme.shape.borderRadius,
        borderTopLeftRadius: theme.shape.borderRadius,
        bottom: 0,
        content: '""',
        left: 0,
        position: "absolute",
        top: 0,
        width: 4,
      },
      backgroundColor: `${theme.palette.primary.main}10`, // 10% opacity version of primary color
      color: theme.palette.primary.main,
      fontWeight: 500,
    },
    "&:hover": {
      "& .item-icon": {
        color: theme.palette.primary.main,
      },
      backgroundColor: `${theme.palette.action.hover}`,
      color: theme.palette.primary.main,
    },
    alignItems: "center",
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
    display: "flex",
    fontSize: "0.9375rem",
    padding: theme.spacing(0.75, 1.5),
    position: "relative",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
  "& .item-icon": {
    alignItems: "center",
    color: theme.palette.text.secondary,
    display: "flex",
    height: 24,
    justifyContent: "center",
    minWidth: 24,
    transition: "color 0.2s ease",
    width: 24,
  },
  "& li": {
    margin: theme.spacing(0.75, 0),
  },
  "& nav": {
    width: "100%",
  },
  "& ul": {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
  height: "100%",
  minWidth: "240px",
  overflowY: "auto",
  padding: theme.spacing(3),
}));
