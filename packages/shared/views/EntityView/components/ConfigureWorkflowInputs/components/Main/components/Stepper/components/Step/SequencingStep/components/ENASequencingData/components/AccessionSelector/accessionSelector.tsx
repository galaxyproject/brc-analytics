import { ErrorIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/ErrorIcon/errorIcon";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { BUTTON_PRESETS } from "@databiosphere/findable-ui/lib/contracts/mui/Button/presets";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
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
import { type FormEvent, type JSX } from "react";
import { StyledDialog } from "./accessionSelector.styles";
import { type Props } from "./types";

export const AccessionSelector = ({
  clearErrors,
  enaAccessionStatus: status,
  onClose,
  onContinue,
  onRequestData,
  open,
  switchBrowseMethod,
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
              onSuccess: (data) => {
                switchBrowseMethod(data);
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
          {...BUTTON_PRESETS.SECONDARY_OUTLINED}
          disabled={status.loading}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          {...BUTTON_PRESETS.PRIMARY_CONTAINED}
          disabled={status.loading}
          type="submit"
        >
          Continue
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
