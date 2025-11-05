import {
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { StyledDialog } from "./accessionSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { FormEvent } from "react";
import { ErrorIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/ErrorIcon/errorIcon";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const AccessionSelector = ({
  clearErrors,
  enaAccessionStatus: status,
  onClose,
  onContinue,
  onRequestData,
  open,
  table,
}: Props): JSX.Element => {
  return (
    <StyledDialog
      fullWidth
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          component: "form",
          onSubmit: (event: FormEvent<HTMLFormElement>) =>
            onRequestData(event, {
              onSuccess: () => {
                table.resetColumnFilters(); // Clear column filters from previous query.
                onContinue();
                onClose();
              },
            }),
        },
        transition: { onExited: clearErrors },
      }}
    >
      <DialogTitle onClose={onClose} title="Select initial filtering" />
      <DialogContent>
        <FormControl
          disabled={status.loading}
          error={!!status.errors?.accession}
        >
          <FormLabel>Run, experiment, sample, or study accessions</FormLabel>
          <OutlinedInput
            disabled={status.loading}
            name="accession"
            onFocus={clearErrors}
            size="small"
          />
          <FormHelperText component="div">
            <Typography
              component="div"
              color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            >
              Separate multiple accessions with any combination of commas and
              spaces.
            </Typography>
            {status.errors?.accession && (
              <Grid alignItems="center" columnGap={1} container direction="row">
                <ErrorIcon fontSize="xxsmall" />
                {status.errors?.accession}
              </Grid>
            )}
          </FormHelperText>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          {...BUTTON_PROPS.SECONDARY_CONTAINED}
          disabled={status.loading}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          disabled={status.loading}
          type="submit"
        >
          Continue
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
