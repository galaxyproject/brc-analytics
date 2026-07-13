import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack.js";
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
import { Table } from "../../../../../../components/common/Table/table";
import { getPangenome } from "../../../../../../services/workflows/entities";
import { StyledSectionTitle } from "../../main.styles";
import { useTable } from "../../table/hooks/UseTable/hook";
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
  const isPangenomeEnabled = useFeatureFlag("pangenome");
  const pangenome = getPangenome(organism.ncbiTaxonomyId);
  const { members } = pangenome ?? {};
  const table = useTable({ columns: COLUMNS, data: members ?? [] });

  if (!isPangenomeEnabled || !pangenome) return null;

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
              {getTrackTypes(pangenome.members.length).map((trackType) => (
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
