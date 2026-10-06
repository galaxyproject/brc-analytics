import type { SidebarProps } from "@repo/shared/views/AssistantView/components/Sidebar/types";

export type ChatHistoryProps = Pick<SidebarProps, "isSaved" | "sessionId">;
