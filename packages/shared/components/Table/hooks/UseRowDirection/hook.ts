import { ROW_DIRECTION } from "@databiosphere/findable-ui/lib/components/Table/common/entities";
import {
  BREAKPOINT_FN_NAME,
  useBreakpointHelper,
} from "@databiosphere/findable-ui/lib/hooks/useBreakpointHelper";

/**
 * Returns the row direction for the table based on the current breakpoint.
 * Vertical on small viewports; horizontal otherwise.
 * @returns Row direction.
 */
export function useRowDirection(): { rowDirection: ROW_DIRECTION } {
  const bpDownSm = useBreakpointHelper(BREAKPOINT_FN_NAME.DOWN, "sm");

  const rowDirection = bpDownSm
    ? ROW_DIRECTION.VERTICAL
    : ROW_DIRECTION.DEFAULT;

  return { rowDirection };
}
