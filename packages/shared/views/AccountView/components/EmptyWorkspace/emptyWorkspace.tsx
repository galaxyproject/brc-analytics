import { Button, Stack, Typography } from "@mui/material";
import { ROUTES } from "@repo/shared/routes/constants";
import Link from "next/link";
import { type JSX } from "react";

/**
 * Shown when a signed-in user has no favorites, analyses, or launches.
 *
 * The four pages this replaces each rendered a bare "you have nothing"
 * sentence, so a new account's whole workspace was blank. One page means one
 * empty state, and it can point somewhere.
 * @returns the getting-started panel.
 */
export function EmptyWorkspace(): JSX.Element {
  return (
    <Stack spacing={3}>
      <Typography variant="body1">
        Your workspace collects the assemblies you save, the analyses you work
        on with the assistant, and the workflows you launch into Galaxy. Nothing
        here yet -- start anywhere.
      </Typography>
      <Stack direction={{ sm: "row", xs: "column" }} spacing={2}>
        <Button LinkComponent={Link} href={ROUTES.GENOMES} variant="contained">
          Browse assemblies
        </Button>
        <Button LinkComponent={Link} href="/assistant" variant="outlined">
          Ask the assistant
        </Button>
        <Button LinkComponent={Link} href={ROUTES.WORKFLOWS} variant="outlined">
          Explore workflows
        </Button>
      </Stack>
    </Stack>
  );
}
