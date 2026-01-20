import {
  Radio,
  RadioGroupProps,
  FormControlLabel,
  Typography,
  Stack,
} from "@mui/material";
import { RadioCheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioCheckedIcon/radioCheckedIcon";
import { RadioUncheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioUncheckedIcon/radioUncheckedIcon";
import { OPTIONS } from "./constants";
import { StyledRadioGroup } from "./radioGroup.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const RadioGroup = ({
  onChange,
  value,
}: Pick<RadioGroupProps, "onChange" | "value">): JSX.Element => {
  return (
    <StyledRadioGroup value={value} onChange={onChange}>
      {OPTIONS.map((option) => (
        <FormControlLabel
          key={option.value}
          control={
            <Radio
              checkedIcon={<RadioCheckedIcon />}
              icon={<RadioUncheckedIcon />}
            />
          }
          label={
            <Stack gap={1} useFlexGap>
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
                {option.label}
              </Typography>
              <Typography
                color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
              >
                {option.description}
              </Typography>
            </Stack>
          }
          value={option.value}
        />
      ))}
    </StyledRadioGroup>
  );
};
