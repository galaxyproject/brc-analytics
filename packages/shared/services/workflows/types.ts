import type { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { type API } from "./routes";

export type EntityGetId = NonNullable<EntityConfig["getId"]>;

export type EntityRoute = keyof typeof API;
