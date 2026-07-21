export const ROUTES = {
  ANALYZE_WORKFLOWS: "/data/assemblies/{entityId}/analyze/workflows",
  CONFIGURE_CUSTOM_WORKFLOW: "/data/assemblies/{entityId}/analyze/custom",
  CONFIGURE_ORGANISM_WORKFLOW:
    "/data/organisms/{entityId}/analyze/workflows?trsId={trsId}",
  CONFIGURE_WORKFLOW:
    "/data/assemblies/{entityId}/analyze/workflows?trsId={trsId}",
  GENOME: "/data/assemblies/{entityId}",
  GENOMES: "/data/assemblies",
  ORGANISM: "/data/organisms/{entityId}",
  ORGANISMS: "/data/organisms",
  WORKFLOW: "/data/workflows/{trsId}",
  WORKFLOWS: "/data/workflows",
};
