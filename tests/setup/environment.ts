// Jest never loads the site .env files -- the build scripts only write
// .env.development and .env.production, and next/jest reads neither under
// NODE_ENV=test -- so NEXT_PUBLIC_ENVIRONMENT is unset under test and anything
// resolving it at import time (packages/shared/components/Document) throws.
// Default to the local environment, leaving an explicitly set value alone.
process.env.NEXT_PUBLIC_ENVIRONMENT ??= "local";
