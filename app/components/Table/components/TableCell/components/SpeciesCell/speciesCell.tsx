import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack, Typography } from "@mui/material";
import { JSX } from "react";
import { TagList } from "./components/TagList/tagList";
import { SpeciesCellProps } from "./types";

/*
 * Renders the consolidated species cell: the species name as a link, an
 * optional accession beneath it, the populated minor taxonomy fields (strain,
 * isolate, serotype, taxonomic group) as chips, then the NCBI taxonomy id. The
 * accession and minor fields are provided by the view builder, so each renders
 * only when present.
 */
export const SpeciesCell = ({
  accession,
  ncbiTaxonomyId,
  species,
  tags,
}: SpeciesCellProps): JSX.Element => {
  return (
    <Stack spacing={2} useFlexGap>
      <Link {...species} />
      {accession && (
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          {accession}
        </Typography>
      )}
      <TagList tags={tags} />
      {ncbiTaxonomyId && (
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          Tax ID: {ncbiTaxonomyId}
        </Typography>
      )}
    </Stack>
  );
};
