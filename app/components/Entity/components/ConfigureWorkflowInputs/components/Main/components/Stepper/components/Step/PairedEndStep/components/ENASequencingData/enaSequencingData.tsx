import { Fragment } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { useENA } from "./hooks/UseENA/useENA";
import { TypographyWordBreak } from "@databiosphere/findable-ui/lib/components/common/Typography/TypographyWordBreak/TypographyWordBreak";
import { CollectionSelector } from "./components/CollectionSelector/collectionSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Button } from "@mui/material";
import { UseENA } from "./hooks/UseENA/types";
import { ReadRun } from "./types";

export const ENASequencingData = (props: UseENA<ReadRun>): JSX.Element => {
  const { data, requestStatus, clearErrors, onRequestData } = props;
  const dialogProps = useDialog();
  return (
    <Fragment>
      {requestStatus.success ? (
        <TypographyWordBreak>
          {JSON.stringify(data)}{" "}
          <Button
            color="primary"
            onClick={dialogProps.onOpen}
            variant="contained"
          >
            Edit
          </Button>
        </TypographyWordBreak>
      ) : (
        <DataSelector
          clearErrors={clearErrors}
          requestStatus={requestStatus}
          onRequestData={onRequestData}
          onSelect={dialogProps.onOpen}
        />
      )}
      <CollectionSelector readRuns={data} {...dialogProps} />
    </Fragment>
  );
};
