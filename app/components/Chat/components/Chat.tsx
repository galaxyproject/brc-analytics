import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ReactMarkdown from "react-markdown";
import { styled } from "@mui/material/styles";

// Define message interface
interface ChatMessage {
  content: string;
  role: "user" | "assistant";
}

interface ChatProps {
  sessionId?: string | null;
}

// Styled components
const ChatContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
  width: "100%",
}));

const ChatMessages = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: theme.spacing(2),
  overflowY: "auto",
  padding: theme.spacing(2),
  paddingTop: theme.spacing(3),
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "isUser",
})<{ isUser: boolean }>(({ isUser, theme }) => ({
  "& p": {
    margin: 0,
  },
  alignSelf: isUser ? "flex-end" : "flex-start",
  animation: "fadeIn 0.3s ease",
  backgroundColor: isUser
    ? theme.palette.primary.main
    : theme.palette.background.paper,
  borderBottomLeftRadius: isUser ? theme.spacing(2) : theme.spacing(0.5),
  borderBottomRightRadius: isUser ? theme.spacing(0.5) : theme.spacing(2),
  borderRadius: theme.spacing(2),
  color: isUser
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  maxWidth: "90%",
  overflowWrap: "break-word",
  padding: theme.spacing(1.5, 2),
  width: "auto",
  wordBreak: "break-word",
}));

const ErrorMessage = styled(Typography)(({ theme }) => ({
  backgroundColor: theme.palette.error.light,
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.error.main,
  fontSize: "0.875rem",
  margin: theme.spacing(1, 0),
  padding: theme.spacing(1),
}));

// API endpoint
const API_URL = "http://localhost:3100/api/chat";

export const Chat: React.FC<ChatProps> = ({
  sessionId: initialSessionId = null,
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session data
  const loadSession = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real implementation, you would fetch the session data from the server
      // For now, we'll just set a welcome message
      setMessages([
        {
          content:
            "Hi! I'm BioBuddy. I can help you with information about organisms, assemblies, workflows, and more. How can I assist you today?",
          role: "assistant",
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load session: ${errorMessage}`);
      console.error("Error loading session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      // TODO: Load session data from server
      loadSession();
    } else {
      setMessages([
        {
          content:
            "Hi! I'm BioBuddy. I can help you with information about organisms, assemblies, workflows, and more. How can I assist you today?",
          role: "assistant",
        },
      ]);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId !== initialSessionId && initialSessionId !== null) {
      // TODO: Load session data from server
      loadSession();
      setSessionId(initialSessionId);
    }
  }, [initialSessionId, sessionId]);

  // Send message to the backend
  const sendMessage = async (): Promise<void> => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { content: userMessage, role: "user" }]);

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(API_URL, {
        body: JSON.stringify({
          message: userMessage,
          ...(sessionId ? { session_id: sessionId } : {}),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Store the session ID for future requests
      if (data.sessionId) {
        setSessionId(data.sessionId);
        console.log(`Using session ID: ${data.sessionId}`);
      }

      // Add assistant response to chat
      setMessages((prev) => [
        ...prev,
        { content: data.response, role: "assistant" },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to send message: ${errorMessage}`);
      console.error("Error sending message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    sendMessage();
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ChatContainer>
      <ChatMessages>
        {messages.map((message, index) => (
          <MessageBubble key={index} isUser={message.role === "user"}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </MessageBubble>
        ))}

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && <ErrorMessage variant="body2">{error}</ErrorMessage>}

        <div ref={messagesEndRef} />
      </ChatMessages>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          alignItems: "flex-end",
          backgroundColor: (theme) => theme.palette.background.paper,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          display: "flex",
          gap: (theme) => theme.spacing(1),
          padding: (theme) => theme.spacing(2),
        }}
      >
        <TextField
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          multiline
          rows={3}
          fullWidth
          disabled={isLoading}
          variant="outlined"
          size="small"
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading || !userInput.trim()}
          endIcon={<SendIcon />}
        >
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </Box>
    </ChatContainer>
  );
};

export default Chat;
