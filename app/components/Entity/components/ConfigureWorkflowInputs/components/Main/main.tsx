import { Props } from "./types";
import { Stepper } from "./components/Stepper/stepper";

export const Main = ({
  configuredInput,
  genome,
  onConfigure,
  workflow,
}: Props): JSX.Element => {
  return (
    <Stepper
      configuredInput={configuredInput}
      genome={genome}
      onConfigure={onConfigure}
      workflow={workflow}
    />
  );
};
