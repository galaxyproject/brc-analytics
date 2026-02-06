import { JSX, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
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
  loading: boolean;
  messages: ChatMessageDisplay[];
  onSend: (message: string) => void;
  suggestions: SuggestionChip[];
}

/**
 * The main chat interface with message list, input, and suggestion chips.
 * @param props - Component props
 * @param props.error - Error message to display
 * @param props.loading - Whether the assistant is processing
 * @param props.messages - Chat message history
 * @param props.onSend - Callback to send a message
 * @param props.suggestions - Suggestion chips to display
 * @returns Chat panel element
 */
export const ChatPanel = ({
  error,
  loading,
  messages,
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

  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.length === 0 && (
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
          <Alert severity="error" sx={{ mx: 1 }}>
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <SuggestionChips
        chips={suggestions}
        disabled={loading}
        onSelect={handleChipSelect}
      />

      <InputRow>
        <TextField
          disabled={loading}
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
          disabled={loading || !input.trim()}
          onClick={handleSend}
          variant="contained"
        >
          Send
        </Button>
      </InputRow>
    </ChatContainer>
  );
};
