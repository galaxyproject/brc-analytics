import { StepProps } from "../../../../../types";

export interface Props extends Pick<StepProps, "configuredInput"> {
  onOpen: () => void;
}
