/**
 * Feature flags enabled for the site. Set at app module load and referenced
 * by build-time computation, so build and client agree on flag state.
 */
export const FEATURE_FLAGS = ["assembly-workflows", "hyphy", "lmls"];
