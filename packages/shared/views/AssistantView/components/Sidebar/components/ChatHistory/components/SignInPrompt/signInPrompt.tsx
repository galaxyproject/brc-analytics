import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { LoginRounded } from "@mui/icons-material";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { Fragment, type JSX } from "react";
import { StyledButton, StyledTypography } from "./signInPrompt.styles";

/**
 * Renders the prompt to sign in, which both keeps the current conversation and
 * shows the user's earlier ones.
 * @returns The sign-in prompt element.
 */
export const SignInPrompt = (): JSX.Element => {
  const { login } = useAuth();
  return (
    <Fragment>
      <StyledTypography
        color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
        component="div"
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}
      >
        Sign in to keep this chat and see previous chat history
      </StyledTypography>
      <StyledButton
        color={BUTTON_PROPS.COLOR.SECONDARY}
        onClick={login}
        startIcon={<LoginRounded />}
        variant={BUTTON_PROPS.VARIANT.CONTAINED}
      >
        Sign in
      </StyledButton>
    </Fragment>
  );
};
