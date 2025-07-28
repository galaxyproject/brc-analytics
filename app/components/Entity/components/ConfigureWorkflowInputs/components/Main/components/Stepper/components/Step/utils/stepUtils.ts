/**
 * Determines if a step should be active based on loading states
 * @param active - Whether the step should be active
 * @param isLoading - Whether the step is currently loading
 * @returns Whether the step should be active
 */
export const getStepActiveState = (
  active: boolean,
  isLoading: boolean
): boolean => {
  return active && !isLoading;
};

/**
 * Determines if a button should be disabled based on various states
 * @param baseDisabled - Base disabled state
 * @param isLoading - Whether currently loading
 * @returns Whether the button should be disabled
 */
export const getButtonDisabledState = (
  baseDisabled: boolean,
  isLoading: boolean
): boolean => {
  return baseDisabled || isLoading;
};
