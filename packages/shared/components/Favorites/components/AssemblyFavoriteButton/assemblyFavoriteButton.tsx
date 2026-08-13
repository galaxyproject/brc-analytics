import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import { useAssemblyFavorites } from "@repo/shared/components/Favorites/hooks/UseAssemblyFavorites/hook";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { type JSX } from "react";
import type { Props } from "./types";

export function AssemblyFavoriteButton({
  accession,
}: Props): JSX.Element | null {
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const { error, isFavorited, isLoading, isToggling, toggleFavorite } =
    useAssemblyFavorites();

  // Login is not enabled on this site — a permanent state, not a loading one —
  // so favorites can't be offered and the button renders nothing.
  if (!isConfigured) return null;

  if (isAuthLoading) {
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

  const favorited = isFavorited(accession);
  const button = (
    <Button
      disabled={isLoading || isToggling}
      onClick={() => void toggleFavorite(accession)}
      startIcon={favorited ? <StarIcon /> : <StarBorderIcon />}
      variant={favorited ? "contained" : "outlined"}
    >
      {favorited ? "Saved" : "Save Assembly"}
    </Button>
  );

  // The toggle stays clickable on failure (the next click clears the error
  // and retries); the tooltip just tells the user the last attempt failed.
  if (error) {
    return (
      <Tooltip title={`Could not update favorite: ${error.message}`}>
        <span>{button}</span>
      </Tooltip>
    );
  }

  return button;
}
