import { useShowPangenome } from "@/views/OrganismView/hooks/UseShowPangenome/hook";
import { Table } from "@brc-analytics/core/components/Table/table";
import { StyledSectionTitle } from "@brc-analytics/core/views/OrganismView/components/Main/main.styles";
import { useTable } from "@brc-analytics/core/views/OrganismView/components/Main/table/hooks/UseTable/hook";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  Chip,
  List,
  ListItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { JSX } from "react";
import { StyledFluidPaper } from "./pangenomeSection.styles";
import { COLUMNS } from "./table/columns";
import { Props } from "./types";
import { getTrackTypes } from "./utils";

/**
 * Pangenome section for the organism page: a bundle header (id + version), a
 * description of the per-assembly UCSC tracks, and a table of member assemblies
 * each linking to its UCSC browser. Rendered under the Assemblies section.
 * Gated on the `pangenome` feature flag and the organism's species having a
 * pangenome — renders nothing otherwise.
 * @param props - Component props.
 * @param props.organism - Organism whose species pangenome to render.
 * @returns The Pangenome section, or null when there is no pangenome to show.
 */
export const PangenomeSection = ({ organism }: Props): JSX.Element | null => {
  const pangenome = useShowPangenome(organism.ncbiTaxonomyId);
  const { members } = pangenome ?? {};
  const table = useTable({ columns: COLUMNS, data: members ?? [] });

  if (!pangenome) return null;

  return (
    <Stack spacing={4} useFlexGap>
      <Stack
        alignItems={STACK_PROPS.ALIGN_ITEMS.CENTER}
        direction={STACK_PROPS.DIRECTION.ROW}
        spacing={2}
        useFlexGap
      >
        <StyledSectionTitle
          component="h2"
          id="pangenome"
          variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
        >
          Pangenome
        </StyledSectionTitle>
        <Chip
          label={`${pangenome.bundleId} · ${pangenome.version}`}
          size={CHIP_PROPS.SIZE.SMALL}
          variant={CHIP_PROPS.VARIANT.STATUS}
        />
      </Stack>
      <StyledFluidPaper elevation={0}>
        <Toolbar>
          <div>
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
              Each assembly&apos;s UCSC browser carries 4 pangenome tracks:
            </Typography>
            <List disablePadding>
              {getTrackTypes(members?.length ?? 0).map((trackType) => (
                <ListItem key={trackType} disablePadding>
                  {trackType}
                </ListItem>
              ))}
            </List>
          </div>
        </Toolbar>
        <Table table={table} />
      </StyledFluidPaper>
    </Stack>
  );
};
