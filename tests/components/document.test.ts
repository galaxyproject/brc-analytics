/**
 * The shared Document resolves the active environment at module scope, and
 * getEnvironment() throws when NEXT_PUBLIC_ENVIRONMENT is unset. Jest never
 * sees the site environment files: the build scripts only write
 * .env.development and .env.production, and next/jest reads neither under
 * NODE_ENV=test. Without a test-time default, importing this module from any
 * test fails with a message about fixing an env file and rebuilding, which is
 * never the actual problem in a test.
 */
describe("shared Document module", () => {
  it("imports under test without a build-time environment file", async () => {
    await expect(
      import("@repo/shared/components/Document/document")
    ).resolves.toBeDefined();
  });
});
