import { JSX } from "react";
import {
  Checkbox,
  Radio,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { StyledStack, StyledTableContainer } from "./compareBaseline.styles";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { Props } from "./types";
import { RadioCheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioCheckedIcon/radioCheckedIcon";
import { RadioUncheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioUncheckedIcon/radioUncheckedIcon";
import { CheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/CheckedIcon/checkedIcon";
import { UncheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/UncheckedIcon/uncheckedIcon";
import { UncheckedDisabledIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/UncheckedDisabledIcon/uncheckedDisabledIcon";
import { CONTRAST_MODE } from "../../hooks/UseRadioGroup/types";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ReactNode } from "react";

export const CompareBaseline = ({
  baseline,
  compare,
  factorValues,
  mode,
  onSelectBaseline,
  onToggleCompare,
}: Props): JSX.Element | null => {
  if (mode !== CONTRAST_MODE.BASELINE) return null;
  if (factorValues.length < 2) return null;
  return (
    <StyledStack gap={5} useFlexGap>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
        Compare Against Baseline
      </Typography>
      <StyledTableContainer>
        <GridTable gridTemplateColumns="repeat(3, 1fr)">
          <TableHead>
            <TableRow>
              <TableCell>Level</TableCell>
              <TableCell>Baseline</TableCell>
              <TableCell>Compare</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {factorValues.map((value) => {
              const isBaseline = baseline === value;
              return (
                <TableRow key={value}>
                  <TableCell>{value}</TableCell>
                  <TableCell>
                    <Radio
                      aria-label="Select baseline"
                      checked={isBaseline}
                      checkedIcon={<RadioCheckedIcon />}
                      icon={<RadioUncheckedIcon />}
                      onChange={() => onSelectBaseline(value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label="Compare against baseline"
                      checked={compare.has(value)}
                      checkedIcon={<CheckedIcon />}
                      disabled={isBaseline}
                      icon={renderIcon(isBaseline)}
                      onChange={() => onToggleCompare(value)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </GridTable>
      </StyledTableContainer>
    </StyledStack>
  );
};

/**
 * Renders the icon for the compare checkbox.
 * @param isBaseline - Whether the value is the baseline.
 * @returns The icon to render.
 */
function renderIcon(isBaseline: boolean): ReactNode {
  if (isBaseline) return <UncheckedDisabledIcon />;
  return <UncheckedIcon />;
}
