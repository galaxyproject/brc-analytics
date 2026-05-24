import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import { JSX } from "react";
import { useAssemblyFavorites } from "../../../hooks/useAssemblyFavorites";
import { useAuth } from "../../../providers/authentication";

interface Props {
  accession: string;
}

export function AssemblyFavoriteButton({ accession }: Props): JSX.Element {
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const { isFavorited, isLoading, toggleFavorite } = useAssemblyFavorites();

  if (!isConfigured || isAuthLoading) {
    return <CircularProgress size={20} />;
  }

  if (!isAuthenticated) {
    return (
      <Tooltip title="Sign in to save favorites">
        <Button
          onClick={login}
          startIcon={<StarBorderIcon />}
          variant="outlined"
        >
          Save Assembly
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button
      disabled={isLoading}
      onClick={() => void toggleFavorite(accession)}
      startIcon={isFavorited(accession) ? <StarIcon /> : <StarBorderIcon />}
      variant={isFavorited(accession) ? "contained" : "outlined"}
    >
      {isFavorited(accession) ? "Saved" : "Save Assembly"}
    </Button>
  );
}
