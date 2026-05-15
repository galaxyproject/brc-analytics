import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { JSX, useEffect, useRef, useState } from "react";
import { SuggestionChip } from "../../../types/api";
import { ChatMessage } from "../ChatMessage/chatMessage";
import { SuggestionChips } from "../SuggestionChips/suggestionChips";
import { ChatContainer, InputRow, MessagesContainer } from "./chatPanel.styles";

interface ChatMessageDisplay {
  content: string;
  role: "user" | "assistant";
}

interface ChatPanelProps {
  error: string | null;
  isRestoring?: boolean;
  loading: boolean;
  messages: ChatMessageDisplay[];
  onRetry?: () => Promise<void>;
  onSend: (message: string) => void;
  suggestions: SuggestionChip[];
}

export const ChatPanel = ({
  error,
  isRestoring,
  loading,
  messages,
  onRetry,
  onSend,
  suggestions,
}: ChatPanelProps): JSX.Element => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (): void => {
    if (input.trim() && !loading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && !loading && input.trim()) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipSelect = (message: string): void => {
    if (!loading) {
      onSend(message);
    }
  };

  const inputDisabled = loading || !!isRestoring;

  return (
    <ChatContainer>
      <MessagesContainer>
        {isRestoring && (
          <Box sx={{ alignItems: "center", display: "flex", gap: 1, p: 4 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary" variant="body2">
              Restoring conversation...
            </Typography>
          </Box>
        )}

        {!isRestoring && messages.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body1">
              Welcome! I can help you explore BRC Analytics data and set up
              analyses. Try asking about organisms, assemblies, or workflows.
            </Typography>
          </Box>
        )}

        {messages.map((msg, i) => (
          <ChatMessage content={msg.content} key={i} role={msg.role} />
        ))}

        {loading && (
          <Box sx={{ display: "flex", gap: 1, p: 1 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary" variant="body2">
              Thinking...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert
            action={
              onRetry && (
                <Button onClick={onRetry} size="small">
                  Retry
                </Button>
              )
            }
            severity="error"
            sx={{ mx: 1 }}
          >
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <SuggestionChips
        chips={suggestions}
        disabled={inputDisabled}
        onSelect={handleChipSelect}
      />

      <InputRow>
        <TextField
          disabled={inputDisabled}
          fullWidth
          maxRows={4}
          multiline
          onChange={(e): void => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about organisms, analyses, or workflows..."
          size="small"
          value={input}
        />
        <Button
          disabled={inputDisabled || !input.trim()}
          onClick={handleSend}
          variant="contained"
        >
          Send
        </Button>
      </InputRow>
    </ChatContainer>
  );
};
