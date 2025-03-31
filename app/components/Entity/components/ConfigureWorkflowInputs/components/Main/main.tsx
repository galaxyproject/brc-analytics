import { Props } from "./types";
import { Stepper } from "./components/Stepper/stepper";

export const Main = ({ genome, onConfigure, workflow }: Props): JSX.Element => {
  return (
    <Stepper genome={genome} onConfigure={onConfigure} workflow={workflow} />
  );
};
