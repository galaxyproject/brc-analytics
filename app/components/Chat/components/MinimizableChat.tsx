import React, { useState } from "react";
import { Box, Fab, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Chat } from "./Chat";
import Image from "next/image";

interface MinimizableChatProps {
  initiallyMinimized?: boolean;
  sessionId?: string | null;
}

export const MinimizableChat: React.FC<MinimizableChatProps> = ({
  initiallyMinimized = true,
  sessionId = null,
}) => {
  const [isMinimized, setIsMinimized] = useState(initiallyMinimized);

  const toggleChat = (): void => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Box sx={{ bottom: 20, position: "fixed", right: 20, zIndex: 1000 }}>
      {isMinimized ? (
        <Fab
          color="primary"
          onClick={toggleChat}
          aria-label="open chat"
          sx={{
            "&:hover": {
              backgroundColor: "#1f1f47",
            },
            backgroundColor: "#28285b",
            overflow: "hidden",
            padding: 0,
          }}
        >
          <Box sx={{ height: 112, position: "relative", width: 112 }}>
            <Image
              alt="BioBuddy"
              layout="fill"
              objectFit="contain"
              priority
              src="/main/biobuddy.png"
            />
          </Box>
        </Fab>
      ) : (
        <Box
          sx={{
            borderRadius: 1,
            boxShadow: 3,
            display: "flex",
            flexDirection: "column",
            height: 600,
            overflow: "hidden",
            position: "relative",
            width: 550,
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              backgroundColor: "#28285b",
              borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 16px",
            }}
          >
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Box
                sx={{
                  borderRadius: "50%",
                  height: 56,
                  overflow: "hidden",
                  position: "relative",
                  width: 56,
                }}
              >
                <Image
                  src="/main/biobuddy.png"
                  alt="BioBuddy"
                  layout="fill"
                  objectFit="contain"
                  priority
                />
              </Box>
              <Typography
                variant="h6"
                sx={{ fontSize: "1rem", fontWeight: 500 }}
              >
                BioBuddy Assistant
              </Typography>
            </Box>
            <Box
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
                alignItems: "center",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                height: 30,
                justifyContent: "center",
                width: 30,
              }}
              onClick={toggleChat}
            >
              <CloseIcon fontSize="small" />
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              height: "calc(100% - 56px)",
            }}
          >
            <Chat sessionId={sessionId} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MinimizableChat;
