import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Fragment, type JSX } from "react";
import type { TabLabelProps } from "./types";
import { getTabLabel } from "./utils";

/**
 * Label for the analysis setup's tab on narrow screens: how many fields are
 * set, with a check once the setup is complete and ready to hand off.
 * @param props - Component props.
 * @param props.handoffUrl - Workflow setup URL, or null until the schema is complete.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @returns The tab label.
 */
export const TabLabel = ({
  handoffUrl,
  schema,
}: TabLabelProps): JSX.Element => {
  return (
    <Fragment>
      {handoffUrl && (
        <CheckCircleRoundedIcon
          color={SVG_ICON_PROPS.COLOR.SUCCESS}
          fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
        />
      )}
      {getTabLabel(schema)}
    </Fragment>
  );
};
