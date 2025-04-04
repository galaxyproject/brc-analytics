import {
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid2,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { StyledDialog } from "./accessionSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import {
  COLOR,
  VARIANT,
} from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { FormEvent } from "react";
import { ErrorIcon } from "@databiosphere/findable-ui/src/components/common/CustomIcon/components/ErrorIcon/errorIcon";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const AccessionSelector = ({
  clearErrors,
  onClose,
  onRequestData,
  onSelect,
  open,
  requestStatus,
}: Props): JSX.Element => {
  const error = requestStatus.errors?.accession;
  const isError = Boolean(error);
  return (
    <StyledDialog
      onClose={onClose}
      open={open}
      PaperProps={{
        component: "form",
        onSubmit: (event: FormEvent<HTMLFormElement>) =>
          onRequestData(event, {
            onSuccess: () => {
              onClose();
              onSelect();
            },
          }),
      }}
    >
      <DialogTitle onClose={onClose} title="Select initial filtering" />
      <DialogContent>
        <FormControl disabled={requestStatus.loading} error={isError}>
          <FormLabel>Run, experiment, sample, or study accessions</FormLabel>
          <OutlinedInput
            disabled={requestStatus.loading}
            name="accession"
            onChange={() => clearErrors("accession")}
            size="small"
          />
          <FormHelperText component="div">
            <Typography
              component="div"
              color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            >
              Separate multiple accessions with any character (like commas or
              spaces). SRR13423209, PRJNA68264, PRJNA604451!
            </Typography>
            {isError && (
              <Grid2
                alignItems="center"
                columnGap={1}
                container
                direction="row"
              >
                <ErrorIcon fontSize="xxsmall" />
                {error}
              </Grid2>
            )}
          </FormHelperText>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          color={COLOR.SECONDARY}
          disabled={requestStatus.loading}
          onClick={onClose}
          variant={VARIANT.CONTAINED}
        >
          Cancel
        </Button>
        <Button
          color={COLOR.PRIMARY}
          disabled={requestStatus.loading}
          type="submit"
          variant={VARIANT.CONTAINED}
        >
          Continue
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
