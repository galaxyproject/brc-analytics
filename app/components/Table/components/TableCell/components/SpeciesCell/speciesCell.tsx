import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack, Typography } from "@mui/material";
import { JSX } from "react";
import { TagList } from "./components/TagList/tagList";
import { SpeciesCellProps } from "./types";

/*
 * Renders the consolidated species cell: the species name as a link, the NCBI
 * taxonomy id, and the populated minor taxonomy fields (strain, isolate,
 * serotype, taxonomic group) plus priority pathogen as chips. Minor fields are
 * provided pre-filtered by the view builder, so a chip renders only when present.
 */
export const SpeciesCell = ({
  ncbiTaxonomyId,
  priorityPathogen,
  species,
  tags,
}: SpeciesCellProps): JSX.Element => {
  return (
    <Stack spacing={2} useFlexGap>
      <Link {...species} />
      {ncbiTaxonomyId && (
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          Taxonomy ID: {ncbiTaxonomyId}
        </Typography>
      )}
      <TagList priorityPathogen={priorityPathogen} tags={tags} />
    </Stack>
  );
};
